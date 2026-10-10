from fastapi.testclient import TestClient

from app.estimation.sample_products import (
    ILLUSTRATIVE_PRICE_SOURCE_LABEL,
    SAMPLE_PRICE_DATE,
)


def test_lists_the_full_catalogue(client: TestClient) -> None:
    response = client.get("/api/v1/products")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 9
    assert len(body["products"]) == 9

    cement = next(product for product in body["products"] if product["id"] == "cement-opc-53-grade")
    assert cement == {
        "id": "cement-opc-53-grade",
        "name": "OPC 53 Grade Cement",
        "category": "Cement",
        "unit": "bag",
        "unitPrice": 410,
        "priceSource": {
            "label": ILLUSTRATIVE_PRICE_SOURCE_LABEL,
            "priceDate": SAMPLE_PRICE_DATE,
            "currency": "INR",
            "isIllustrative": True,
        },
    }


def test_every_product_is_flagged_illustrative(client: TestClient) -> None:
    products = client.get("/api/v1/products").json()["products"]

    for product in products:
        assert product["unitPrice"] > 0
        assert product["priceSource"]["isIllustrative"] is True
        assert product["priceSource"]["priceDate"] == SAMPLE_PRICE_DATE
        assert product["priceSource"]["label"] == ILLUSTRATIVE_PRICE_SOURCE_LABEL


def test_filters_by_category(client: TestClient) -> None:
    body = client.get("/api/v1/products", params={"category": "Steel"}).json()

    assert body["count"] == 2
    assert {product["id"] for product in body["products"]} == {
        "steel-tmt-fe500",
        "binding-wire-18g",
    }


def test_filters_by_unit(client: TestClient) -> None:
    body = client.get("/api/v1/products", params={"unit": "m3"}).json()

    assert body["count"] == 2
    assert {product["id"] for product in body["products"]} == {"sand-river", "aggregate-20mm"}


def test_search_is_case_insensitive_over_name_and_id(client: TestClient) -> None:
    by_name = client.get("/api/v1/products", params={"search": "cement"}).json()
    by_id = client.get("/api/v1/products", params={"search": "TMT"}).json()

    assert by_name["count"] == 1
    assert by_name["products"][0]["id"] == "cement-opc-53-grade"
    assert by_id["count"] == 1
    assert by_id["products"][0]["id"] == "steel-tmt-fe500"


def test_unknown_filter_returns_empty_list_not_404(client: TestClient) -> None:
    response = client.get("/api/v1/products", params={"category": "Nonexistent"})

    assert response.status_code == 200
    assert response.json() == {"count": 0, "products": []}


def test_malformed_unit_filter_returns_400_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/products", params={"unit": "litre"})

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "REQUEST_MALFORMED"
