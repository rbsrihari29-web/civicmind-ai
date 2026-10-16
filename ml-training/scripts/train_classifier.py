"""
CivicMind AI - Image Classifier Training Pipeline
Trains an optimized convolutional neural network (CivicNet) for 6-class civic defect triage.
Generates evaluation metrics, per-class F1, confusion matrix, and metadata artifact.
"""

import os
import json
import random
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
EVAL_DIR = os.path.join(BASE_DIR, "evaluations")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(ARTIFACTS_DIR, "civicmind_mobilenetv3.pt")
METADATA_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")
EVAL_PATH = os.path.join(EVAL_DIR, "image_model_evaluation.json")

BATCH_SIZE = 16
NUM_EPOCHS = 8
LEARNING_RATE = 0.001
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CLASS_DISPLAY_NAMES = {
    "damaged_infrastructure": "Damaged Public Infrastructure",
    "fallen_tree_obstruction": "Fallen Tree or Obstruction",
    "garbage_accumulation": "Garbage Accumulation",
    "other_uncertain": "Other / Normal Condition",
    "pothole_road_damage": "Pothole or Road Damage",
    "waterlogging_flooding": "Waterlogging or Flooding"
}

class CivicNet(nn.Module):
    def __init__(self, num_classes=6):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2), # 112
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2), # 56
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2), # 28
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

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_test_transform

def train_and_evaluate():
    print(f"Training CivicMind AI Vision Classifier on {DEVICE}...")
    train_tf, val_test_tf = get_transforms()

    train_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "train"), transform=train_tf)
    val_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "val"), transform=val_test_tf)
    test_dataset = datasets.ImageFolder(os.path.join(DATA_DIR, "test"), transform=val_test_tf)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"Detected classes ({num_classes}): {class_names}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    model = CivicNet(num_classes).to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=4, gamma=0.5)

    best_val_acc = 0.0
    history = []

    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(DEVICE), targets.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == targets.data).item()
            total += targets.size(0)

        scheduler.step()
        train_loss = running_loss / total
        train_acc = correct / total

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(DEVICE), targets.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * inputs.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == targets.data).item()
                val_total += targets.size(0)

        val_loss = val_loss / val_total
        val_acc = val_correct / val_total

        print(f"Epoch {epoch+1}/{NUM_EPOCHS} -> Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        history.append({
            "epoch": epoch + 1,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4)
        })

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), MODEL_PATH)

    print(f"\nTraining completed. Best Validation Accuracy: {best_val_acc:.4f}")
    print(f"Saved best model checkpoint to {MODEL_PATH}")

    # Test Set Evaluation
    print("\nRunning rigorous evaluation on held-out test split...")
    model.load_state_dict(torch.load(MODEL_PATH, weights_only=True))
    model.eval()

    all_preds = []
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(DEVICE), targets.to(DEVICE)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_probs = np.array(all_probs)

    test_acc = float(np.mean(all_preds == all_targets))
    cm = confusion_matrix(all_targets, all_preds)
    precision, recall, f1, support = precision_recall_fscore_support(all_targets, all_preds, average=None)

    per_class_metrics = {}
    for i, cls_name in enumerate(class_names):
        per_class_metrics[cls_name] = {
            "display_name": CLASS_DISPLAY_NAMES.get(cls_name, cls_name),
            "precision": round(float(precision[i]), 4),
            "recall": round(float(recall[i]), 4),
            "f1_score": round(float(f1[i]), 4),
            "support": int(support[i])
        }

    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(all_targets, all_preds, average="macro")
    baseline_accuracy = round(1.0 / num_classes, 4)

    eval_results = {
        "model_name": "CivicNet Convolutional Classifier",
        "model_version": "v1.0.0",
        "architecture": "civicnet_4conv",
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "test_dataset_size": len(test_dataset),
        "overall_test_accuracy": round(test_acc, 4),
        "macro_precision": round(float(macro_p), 4),
        "macro_recall": round(float(macro_r), 4),
        "macro_f1": round(float(macro_f1), 4),
        "baseline_chance_accuracy": baseline_accuracy,
        "accuracy_gain_over_baseline": round(test_acc - baseline_accuracy, 4),
        "confusion_matrix": cm.tolist(),
        "classes": class_names,
        "per_class_metrics": per_class_metrics,
        "training_history": history
    }

    metadata = {
        "model_name": "civicmind_mobilenetv3",
        "model_version": "v1.0.0",
        "classes": class_names,
        "class_display_names": CLASS_DISPLAY_NAMES,
        "input_resolution": [224, 224],
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225]
        },
        "confidence_threshold": 0.65,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "test_accuracy": round(test_acc, 4),
        "macro_f1": round(float(macro_f1), 4)
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    with open(EVAL_PATH, "w") as f:
        json.dump(eval_results, f, indent=2)

    print("\n================ EVALUATION SUMMARY ================")
    print(f"Overall Test Accuracy: {test_acc*100:.2f}%")
    print(f"Macro F1-Score: {macro_f1:.4f}")
    print(f"Baseline Comparison: {test_acc*100:.2f}% vs Baseline {baseline_accuracy*100:.2f}% (Gain: +{(test_acc-baseline_accuracy)*100:.2f}%)")
    print("Confusion Matrix:")
    print(cm)
    print("Per-class Metrics:")
    for cls_name, m in per_class_metrics.items():
        print(f"  {cls_name:25s}: P={m['precision']:.3f}, R={m['recall']:.3f}, F1={m['f1_score']:.3f}")
    print(f"Saved evaluation artifact to: {EVAL_PATH}")
    print(f"Saved metadata to: {METADATA_PATH}")

if __name__ == "__main__":
    train_and_evaluate()
