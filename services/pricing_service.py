import math
from typing import Literal, TypedDict

FALLBACK_DISTANCES = {
    'casablanca-rabat': 87,
    'rabat-casablanca': 87,
    'casablanca-marrakech': 240,
    'marrakech-casablanca': 240,
    'casablanca-agadir': 460,
    'agadir-casablanca': 460,
    'rabat-tangier': 250,
    'tangier-rabat': 250,
    'marrakech-agadir': 260,
    'agadir-marrakech': 260,
    'fez-meknes': 60,
    'meknes-fez': 60,
    'casablanca-fez': 295,
    'fez-casablanca': 295,
}

def get_distance(city_from: str, city_to: str) -> float:
    key = f"{city_from.lower().strip()}-{city_to.lower().strip()}"
    return FALLBACK_DISTANCES.get(key, 100.0)

PRICING_RULES = {
    'BASE_RATE_PER_KM': 0.5,
    'WEIGHT_RATE_PER_KG': 5.0,
    'FRAGILITY_SURCHARGE': 50.0,
    'BASE_FEE': 20.0,
    'GROUP_DISCOUNT_PCT': 20.0
}

class PricingInput(TypedDict):
    cityFrom: str
    cityTo: str
    weightKg: float
    fragile: bool
    type: Literal['SOLO', 'GROUP']

def calculate_price(input_data: PricingInput) -> int:
    distance = get_distance(input_data['cityFrom'], input_data['cityTo'])
    
    cost = PRICING_RULES['BASE_FEE']
    cost += distance * PRICING_RULES['BASE_RATE_PER_KM']
    cost += input_data['weightKg'] * PRICING_RULES['WEIGHT_RATE_PER_KG']
    
    if input_data['fragile']:
        cost += PRICING_RULES['FRAGILITY_SURCHARGE']
        
    if input_data['type'] == 'GROUP':
        cost *= (1 - (PRICING_RULES['GROUP_DISCOUNT_PCT'] / 100.0))
        
    return int(round(cost))

def generate_route_slug(city_from: str, city_to: str) -> str:
    return f"{city_from.lower().strip()}-{city_to.lower().strip()}"
