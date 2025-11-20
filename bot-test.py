import requests
import random
import time
from concurrent.futures import ThreadPoolExecutor

# ================= CONFIGURATION =================
BASE_URL = "https://tissage-de-mot.vercel.app"
API_ENDPOINT = f"{BASE_URL}/api/words"

TOTAL_WORDS = 60        # Nombre de mots
CONCURRENT_USERS = 5    # Utilisateurs simultanés
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

# LES MÊMES ZONES QUE LE SITE (Pour un rendu identique)
COLOR_ZONES = [
    {"h": [350, 10],  "s": [75, 95], "l": [55, 65]}, # Rouge Rubis
    {"h": [20, 40],   "s": [80, 100],"l": [60, 70]}, # Orange Solaire
    {"h": [45, 55],   "s": [85, 100],"l": [50, 65]}, # Or Chaud
    {"h": [130, 160], "s": [65, 85], "l": [50, 65]}, # Vert Émeraude
    {"h": [170, 190], "s": [75, 95], "l": [55, 70]}, # Cyan Lagon
    {"h": [210, 240], "s": [70, 90], "l": [55, 70]}, # Bleu Profond
    {"h": [260, 280], "s": [70, 90], "l": [60, 70]}, # Violet Royal
    {"h": [290, 315], "s": [75, 95], "l": [55, 65]}, # Magenta Vif
    {"h": [325, 345], "s": [70, 90], "l": [60, 75]}  # Rose Poudré
]

def get_premium_color():
    """Génère une couleur identique au style du site"""
    zone = random.choice(COLOR_ZONES)
    
    h_min, h_max = zone["h"]
    if h_min > h_max: # Gestion passage par 0 (Rouge)
        h_max += 360
        
    hue = random.uniform(h_min, h_max)
    if hue > 360: hue -= 360
    
    sat = random.uniform(zone["s"][0], zone["s"][1])
    light = random.uniform(zone["l"][0], zone["l"][1])
    
    return f"hsl({int(hue)}, {int(sat)}%, {int(light)}%)"

def send_word(index):
    word = random.choice(VOCABULARY)
    # Position avec marges de sécurité (0.1 - 0.9)
    x = round(random.uniform(0.1, 0.9), 4)
    y = round(random.uniform(0.1, 0.9), 4)
    color = get_premium_color()

    try:
        time.sleep(random.uniform(0.05, 0.3))
        response = requests.post(API_ENDPOINT, json={
            "text": word, "x": x, "y": y, "color": color
        }, timeout=5)
        
        if response.status_code == 201:
            print(f"✅ [{index}] '{word}' ajouté ({color})")
            return True
    except:
        return False

def run_simulation():
    print(f"🚀 Simulation STYLE PREMIUM sur {BASE_URL}")
    with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        list(executor.map(send_word, range(1, TOTAL_WORDS + 1)))

if __name__ == "__main__":
    run_simulation()