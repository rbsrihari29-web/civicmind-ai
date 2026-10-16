from app.rag.engine import rag_engine

def test_rag_index_contains_chunks():
    assert len(rag_engine.chunks_metadata) >= 5

def test_retrieval_relevance_pothole_sla():
    chunks = rag_engine.retrieve("pothole repair SLA timeline in Chennai", top_k=3)
    assert len(chunks) > 0
    # Any of the top retrieved chunks covers potholes, SLA, or municipal guidelines
    found_relevant = any(
        "pothole" in c["content"].lower() or 
        "sla" in c["content"].lower() or 
        "charter" in c["document_title"].lower() or
        "roads" in c["document_title"].lower()
        for c in chunks
    )
    assert found_relevant is True
    assert chunks[0]["relevance_score"] > 0.10

def test_grounded_answer_generation():
    res = rag_engine.generate_grounded_answer(
        "What is the statutory timeline for pothole repair on Bus Route Roads?"
    )
    assert "answer" in res
    assert "48 hours" in res["answer"] or "Citizen Charter" in res["answer"]
    assert len(res["citations"]) > 0
    assert res["is_grounded"] is True
    assert res["citations"][0]["document_title"] is not None
