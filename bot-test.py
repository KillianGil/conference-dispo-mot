import requests
import random
import time
import math
from concurrent.futures import ThreadPoolExecutor

# ================= CONFIGURATION =================
BASE_URL = "https://tissage-de-mot.vercel.app"
API_ENDPOINT = f"{BASE_URL}/api/words"

TOTAL_WORDS = 60        
CONCURRENT_USERS = 5    
# =================================================

VOCABULARY = [
    "Bravo", "Merci", "Super", "Génial", "Top", "Wow", "Incroyable", "Respect", "Ouf", 
    "Excellent", "J'adore", "Tissage", "Lien", "Connexion", "Réseau", "Ensemble", 
    "Communauté", "Partage", "Futur", "Innovation", "Tech", "Code", "Design", "Art", 
    "Web", "Data", "IA", "Harmonie", "Monde", "Planète", "Inspirant", "Pertinent", 
    "Clair", "Complexe", "Puissant", "Poétique", "Logique", "Fluide", "Lumineux", 
    "Sombre", "Abstrait", "Concret", "Hop", "Go", "Vite", "Loin", "Ici", "Maintenant", 
    "Demain", "Hier", "Bug", "Fix", "Deploy", "Server", "Client", "User"
]

# PALETTE "PREMIUM" (Identique au site)
COLOR_ZONES = [
    {"h": [350, 10],  "s": [75, 95], "l": [55, 65]}, 
    {"h": [20, 40],   "s": [80, 100],"l": [60, 70]}, 
    {"h": [45, 55],   "s": [85, 100],"l": [50, 65]}, 
    {"h": [130, 160], "s": [65, 85], "l": [50, 65]}, 
    {"h": [170, 190], "s": [75, 95], "l": [55, 70]}, 
    {"h": [210, 240], "s": [70, 90], "l": [55, 70]}, 
    {"h": [260, 280], "s": [70, 90], "l": [60, 70]}, 
    {"h": [290, 315], "s": [75, 95], "l": [55, 65]}, 
    {"h": [325, 345], "s": [70, 90], "l": [60, 75]}  
]

# Mémoire locale du bot pour éviter les collisions
placed_words = []

def get_premium_color():
    zone = random.choice(COLOR_ZONES)
    h_min, h_max = zone["h"]
    if h_min > h_max: h_max += 360
    hue = random.uniform(h_min, h_max)
    if hue > 360: hue -= 360
    sat = random.uniform(zone["s"][0], zone["s"][1])
    light = random.uniform(zone["l"][0], zone["l"][1])
    return f"hsl({int(hue)}, {int(sat)}%, {int(light)}%)"

def get_valid_position():
    """Cherche une position libre (max 50 tentatives)"""
    min_dist = 0.08 # Distance minimale (8% de l'écran)
    
    for _ in range(50):
        x = round(random.uniform(0.1, 0.9), 4)
        y = round(random.uniform(0.1, 0.9), 4)
        
        collision = False
        for pw in placed_words:
            dist = math.sqrt((pw['x'] - x)**2 + (pw['y'] - y)**2)
            if dist < min_dist:
                collision = True
                break
        
        if not collision:
            return x, y
            
    # Si échec, on renvoie quand même une position aléatoire
    return round(random.uniform(0.1, 0.9), 4), round(random.uniform(0.1, 0.9), 4)

def send_word(index):
    word = random.choice(VOCABULARY)
    x, y = get_valid_position()
    
    # On enregistre la position pour les suivants
    placed_words.append({'x': x, 'y': y})
    
    color = get_premium_color()

    try:
        time.sleep(random.uniform(0.05, 0.3))
        response = requests.post(API_ENDPOINT, json={
            "text": word, "x": x, "y": y, "color": color
        }, timeout=5)
        
        if response.status_code == 201:
            print(f"✅ [{index}] '{word}' placé en ({x}, {y})")
            return True
    except:
        return False

def run_simulation():
    print(f"🚀 Simulation INTELLIGENTE sur {BASE_URL}")
    # On vide la mémoire locale du bot au démarrage
    placed_words.clear()
    
    # On utilise map simple au lieu de ThreadPool pour garantir l'ordre de placement (plus sûr pour éviter collisions)
    # Ou on garde ThreadPool mais avec le risque que 2 threads prennent la même place en même temps.
    # Pour un test parfait, on fait séquentiel rapide ou on accepte un peu de chaos que le site gérera.
    with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        list(executor.map(send_word, range(1, TOTAL_WORDS + 1)))

if __name__ == "__main__":
    run_simulation()