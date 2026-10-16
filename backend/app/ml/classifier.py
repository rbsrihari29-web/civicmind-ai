import os
import json
import io
from typing import Dict, Any, Optional, List
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms
from app.core.config import settings

class CivicNet(nn.Module):
    def __init__(self, num_classes=6):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.classifier = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = torch.flatten(x, 1)
        return self.classifier(x)

class CivicImageClassifier:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.metadata = None
        self.classes = []
        self.class_display_names = {}
        self.confidence_threshold = settings.CONFIDENCE_THRESHOLD
        self.is_loaded = False
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        self._load_model()

    def _load_model(self):
        model_path = os.path.abspath(settings.ML_MODEL_PATH)
        metadata_path = os.path.abspath(settings.ML_METADATA_PATH)

        if not os.path.exists(model_path) or not os.path.exists(metadata_path):
            print(f"[CivicImageClassifier] Warning: Model artifacts not found at {model_path} or {metadata_path}.")
            self.is_loaded = False
            return

        try:
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)
            self.classes = self.metadata.get("classes", [])
            self.class_display_names = self.metadata.get("class_display_names", {})
            self.confidence_threshold = self.metadata.get("confidence_threshold", settings.CONFIDENCE_THRESHOLD)

            net = CivicNet(len(self.classes))
            net.load_state_dict(torch.load(model_path, map_location=self.device, weights_only=True))
            net.to(self.device)
            net.eval()
            self.model = net
            self.is_loaded = True
            print(f"[CivicImageClassifier] Successfully loaded model {self.metadata.get('model_version')} with {len(self.classes)} classes.")
        except Exception as e:
            print(f"[CivicImageClassifier] Error loading model: {e}")
            self.is_loaded = False

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Accepts raw image bytes, runs real ML inference, and returns structured predictions.
        If model is not loaded, explicitly returns model_trained=False without fabricating predictions.
        """
        if not self.is_loaded or self.model is None:
            return {
                "model_trained": False,
                "error": "Image classifier model has not been trained or weights are not loaded.",
                "predicted_category": "other_uncertain",
                "category_label": "Untrained Model / Manual Review Required",
                "confidence": 0.0,
                "is_low_confidence": True,
                "review_required": True,
                "model_version": "none",
                "class_probabilities": [],
                "alternative_predictions": []
            }

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self.transform(img).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()

            pred_idx = int(torch.argmax(logits, dim=1).item())
            pred_class = self.classes[pred_idx]
            confidence = float(probs[pred_idx])

            # Sort probabilities descending
            sorted_indices = probs.argsort()[::-1]
            all_probs = []
            for idx in sorted_indices:
                cls_key = self.classes[idx]
                all_probs.append({
                    "category": cls_key,
                    "label": self.class_display_names.get(cls_key, cls_key),
                    "probability": round(float(probs[idx]), 4)
                })

            alternatives = all_probs[1:4]
            is_low_confidence = confidence < self.confidence_threshold
            review_required = is_low_confidence or (pred_class == "other_uncertain")

            return {
                "model_trained": True,
                "predicted_category": pred_class,
                "category_label": self.class_display_names.get(pred_class, pred_class),
                "confidence": round(confidence, 4),
                "is_low_confidence": is_low_confidence,
                "review_required": review_required,
                "model_version": self.metadata.get("model_version", "v1.0.0"),
                "class_probabilities": all_probs,
                "alternative_predictions": alternatives
            }
        except Exception as e:
            return {
                "model_trained": True,
                "error": f"Inference processing error: {str(e)}",
                "predicted_category": "other_uncertain",
                "category_label": "Processing Error",
                "confidence": 0.0,
                "is_low_confidence": True,
                "review_required": True,
                "model_version": "error",
                "class_probabilities": [],
                "alternative_predictions": []
            }

    def extract_image_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        """Extract a 128-dimensional latent feature vector for duplicate image comparison."""
        if not self.is_loaded or self.model is None:
            return None
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self.transform(img).unsqueeze(0).to(self.device)
            with torch.no_grad():
                features = self.model.features(tensor)
                emb = torch.flatten(features, 1)
                emb = nn.functional.normalize(emb, p=2, dim=1).squeeze(0).cpu().numpy()
            return [round(float(v), 5) for v in emb]
        except Exception as e:
            print(f"[CivicImageClassifier] Embedding error: {e}")
            return None

image_classifier = CivicImageClassifier()
