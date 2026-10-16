import io
from PIL import Image
from app.ml.classifier import image_classifier

def test_classifier_loaded():
    assert image_classifier.is_loaded is True
    assert len(image_classifier.classes) == 6
    assert "pothole_road_damage" in image_classifier.classes

def test_inference_on_synthetic_image():
    # Create simple in-memory test image
    img = Image.new("RGB", (224, 224), color=(60, 60, 60))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    result = image_classifier.predict(img_bytes)
    assert result["model_trained"] is True
    assert result["predicted_category"] in image_classifier.classes
    assert 0.0 <= result["confidence"] <= 1.0
    assert len(result["class_probabilities"]) == 6

    total_prob = sum(p["probability"] for p in result["class_probabilities"])
    assert 0.95 <= total_prob <= 1.05

def test_image_embedding_extraction():
    img = Image.new("RGB", (224, 224), color=(80, 80, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    emb = image_classifier.extract_image_embedding(img_bytes)
    assert emb is not None
    assert len(emb) == 128
    # Test L2 norm is approximately 1.0
    import math
    norm = math.sqrt(sum(v*v for v in emb))
    assert 0.95 <= norm <= 1.05
