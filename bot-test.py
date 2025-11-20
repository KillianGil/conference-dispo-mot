import requests
import random
import time
import threading
from concurrent.futures import ThreadPoolExecutor

# ================= CONFIGURATION =================
# ⚠️ METS L'URL DE TON SITE ICI (sans le / à la fin si possible)
BASE_URL = "https://tissage-de-mot.vercel.app" 
API_ENDPOINT = f"{BASE_URL}/api/words"

# Nombre de mots total à envoyer
TOTAL_WORDS = 100

# Nombre d'envois simultanés (pour simuler l'amphi)
CONCURRENT_USERS = 10
# =================================================

# Liste de vocabulaire réaliste
VOCABULARY = [
    "Bravo", "Merci", "Super", "Génial", "Top", "Wow", "Incroyable", 
    "Respect", "Ouf", "Excellent", "J'adore", "Clap clap", "Brillant",
    "Tissage", "Lien", "Connexion", "Réseau", "Ensemble", "Communauté",
    "Partage", "Futur", "Innovation", "Tech", "Code", "Design", "Art",
    "Web", "Data", "IA", "Algorithme", "Structure", "Système", "Chaos",
    "Harmonie", "Monde", "Planète", "Humanité", "Société", "Culture",
    "Inspirant", "Pertinent", "Clair", "Complexe", "Puissant", "Émouvant",
    "Poétique", "Logique", "Rapide", "Fluide", "Dense", "Lumineux",
    "Sombre", "Abstrait", "Concret", "Utile", "Drôle", "Serieux",
    "Hop", "Go", "Vite", "Loin", "Ici", "Maintenant", "Demain", "Hier",
    "Bug", "Fix", "Deploy", "Server", "Client", "User", "Interface"
]

def generate_random_data():
    """Génère les données requises par ton API (api/words.js)"""
    word = random.choice(VOCABULARY)
    
    # Position aléatoire (entre 0.1 et 0.9 pour rester visible)
    x = round(random.uniform(0.1, 0.9), 4)
    y = round(random.uniform(0.1, 0.9), 4)
    
    # Couleur aléatoire format HSL (comme dans ton script.js)
    hue = random.randint(0, 360)
    color = f"hsl({hue}, 70%, 60%)"
    
    return {
        "text": word,
        "x": x,
        "y": y,
        "color": color
    }

def send_word(index):
    """Envoie un mot unique à l'API"""
    data = generate_random_data()
    
    try:
        # Petit délai aléatoire pour faire plus "humain"
        time.sleep(random.uniform(0.1, 0.5))
        
        response = requests.post(API_ENDPOINT, json=data, timeout=5)
        
        if response.status_code == 201:
            print(f"✅ [{index}] Envoyé : '{data['text']}' (x={data['x']}, y={data['y']})")
            return True
        else:
            print(f"⚠️ [{index}] Erreur {response.status_code} : {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ [{index}] Échec connexion : {e}")
        return False

def run_simulation():
    print(f"🚀 Démarrage du stress-test sur : {API_ENDPOINT}")
    print(f"🎯 Objectif : {TOTAL_WORDS} mots avec {CONCURRENT_USERS} utilisateurs simultanés\n")
    
    start_time = time.time()
    success_count = 0
    
    # Utilisation de ThreadPoolExecutor pour simuler la simultanéité
    with ThreadPoolExecutor(max_workers=CONCURRENT_USERS) as executor:
        # Lance les tâches
        results = list(executor.map(send_word, range(1, TOTAL_WORDS + 1)))
        
    success_count = results.count(True)
    duration = time.time() - start_time
    
    print("\n" + "="*40)
    print(f"🏁 Simulation terminée en {duration:.2f} secondes")
    print(f"📊 Succès : {success_count} / {TOTAL_WORDS}")
    print("="*40)

if __name__ == "__main__":
    run_simulation()