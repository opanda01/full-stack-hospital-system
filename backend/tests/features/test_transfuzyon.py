from app.features.transfuzyon.service import kan_uyumlu


def test_kan_uyumlu_ab():
    assert kan_uyumlu("A RH+", "0 RH+")
    assert not kan_uyumlu("A RH-", "A RH+")


def test_kan_uyumlu_ab_rh():
    assert kan_uyumlu("AB RH+", "AB RH-")
