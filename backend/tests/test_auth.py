import pytest
from app.security.auth import get_password_hash, verify_password, create_access_token
import jwt
from app.core.config import settings

def test_password_hashing():
    pw = "SecretCivicPass@123"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation_and_decoding():
    payload = {"sub": "42", "role": "citizen"}
    token = create_access_token(payload)
    assert isinstance(token, str)

    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "42"
    assert decoded["role"] == "citizen"
    assert "exp" in decoded
