import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Config Streamlit
st.set_page_config(layout="wide")
st.title("📊 Fiche Joueur - Saison 2024/25")

# ⬆️ Upload du fichier CSV
uploaded_file = st.file_uploader("Charge ton fichier CSV de joueurs", type=["csv"])

if uploaded_file:
    df = pd.read_csv(uploaded_file)

    # ➕ Sélection joueur
    joueur = st.selectbox("Choisis un joueur", sorted(df["Player"].unique()))
    data = df[df["Player"] == joueur].squeeze()

    st.header(f"🧑‍💼 {joueur} - {data['Squad']} ({data['Pos']})")

    st.markdown(f"""
    **Âge** : {data['Age']} ans  
    **Taille** : {data.get('Height', '—')}  
    **Pied fort** : {data.get('Foot', '—')}  
    **Note moyenne** : {data.get('Rating', '—')}  
    """)

    # 🎯 Statistiques par 90 minutes
    st.subheader("📈 Statistiques avancées (par 90 min) + Percentiles")

    # Utilisation des colonnes disponibles dans votre CSV
    cols_metrics = [
        ("Buts", "Gls", "Goals_per90"),
        ("Passes déc.", "Ast", "Assists_per90"),
        ("xG", "xG", "xG_per90"),
        ("xA", "xAG", "xA_per90"),
        ("Passes progressives", "PrgP", "Progressive_passes_per90"),
        ("Dribbles réussis", "Succ", "Dribbles_per90"),
        ("Tacles", "Tkl", "Tackles_per90"),
        ("Interceptions", "Int", "Interceptions_per90"),
    ]

    for label, col_val, col_per90 in cols_metrics:
        if col_val in data:
            val = round(data[col_val], 2) if pd.notna(data[col_val]) else 0
            # Calcul simple de percentile basé sur la position relative dans l'équipe
            position_players = df[df['Pos'] == data['Pos']]
            if len(position_players) > 1 and col_val in position_players.columns:
                rank = position_players[col_val].rank(pct=True)[data.name] * 100
                pct = int(rank) if pd.notna(rank) else 50
            else:
                pct = 50  # Valeur par défaut
            
            color = "🟥" if pct < 40 else "🟨" if pct < 70 else "🟩"
            st.write(f"**{label}** : {val} — {color} {pct}ᵉ percentile")
            st.progress(pct / 100)

    # 🧠 Analyse automatique
    st.markdown("---")
    st.subheader("🧠 Résumé analytique")
    
    # Calcul de quelques métriques pour l'analyse
    goals_per_90 = (data.get('Gls', 0) / data.get('Min', 90)) * 90 if data.get('Min', 0) > 0 else 0
    assists_per_90 = (data.get('Ast', 0) / data.get('Min', 90)) * 90 if data.get('Min', 0) > 0 else 0
    
    if goals_per_90 > 0.5 and assists_per_90 > 0.3:
        st.success("Joueur créatif, excellent dans la finition et la dernière passe.")
    elif data.get('Tkl', 0) > 2:
        st.success("Joueur très actif à la récupération.")
    elif data.get('PrgP', 0) > 5:
        st.info("Joueur clé dans la construction du jeu, excellent passeur progressif.")
    else:
        st.info("Profil équilibré. Potentiel à développer dans un système adapté.")

    # Affichage des statistiques détaillées
    st.markdown("---")
    st.subheader("📊 Statistiques détaillées")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**⚽ Attaque**")
        st.write(f"Buts: {data.get('Gls', 0)}")
        st.write(f"Passes décisives: {data.get('Ast', 0)}")
        st.write(f"xG: {data.get('xG', 0)}")
        st.write(f"xA: {data.get('xAG', 0)}")
        st.write(f"Tirs: {data.get('Sh', 0)}")
        
    with col2:
        st.markdown("**🛡️ Défense**")
        st.write(f"Tacles: {data.get('Tkl', 0)}")
        st.write(f"Interceptions: {data.get('Int', 0)}")
        st.write(f"Dégagements: {data.get('Clr', 0)}")
        st.write(f"Fautes: {data.get('Fls', 0)}")
        st.write(f"Cartons jaunes: {data.get('CrdY', 0)}")

    # Graphique simple des performances
    if st.button("Afficher graphique de performance"):
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Préparer les données pour le graphique radar
        categories = ['Buts', 'Assists', 'xG', 'xA', 'Tacles', 'Passes prog.']
        values = [
            data.get('Gls', 0),
            data.get('Ast', 0),
            data.get('xG', 0),
            data.get('xAG', 0),
            data.get('Tkl', 0),
            data.get('PrgP', 0)
        ]
        
        # Normaliser les valeurs (0-1)
        max_values = [20, 15, 15, 10, 10, 50]  # Valeurs maximales approximatives
        normalized_values = [min(v/m, 1) for v, m in zip(values, max_values)]
        
        # Créer un graphique en barres
        ax.bar(categories, normalized_values, color='skyblue', alpha=0.7)
        ax.set_ylim(0, 1)
        ax.set_title(f'Profil de performance - {joueur}')
        ax.set_ylabel('Performance normalisée (0-1)')
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        st.pyplot(fig)

    st.markdown("---")
    st.caption("Généré automatiquement à partir des données CSV 2024/25 — Projet de Khalil 🧬")

else:
    st.info("Veuillez charger votre fichier CSV de joueurs pour commencer l'analyse.")
    st.markdown("""
    ### Comment utiliser cette application:
    1. Chargez votre fichier CSV contenant les données des joueurs
    2. Sélectionnez un joueur dans la liste déroulante
    3. Explorez ses statistiques et analyses automatiques
    
    ### Colonnes attendues dans le CSV:
    - `Player`: Nom du joueur
    - `Squad`: Équipe
    - `Pos`: Position
    - `Age`: Âge
    - `Gls`: Buts
    - `Ast`: Passes décisives
    - `xG`: Expected Goals
    - `xAG`: Expected Assists
    - `Tkl`: Tacles
    - `Int`: Interceptions
    - `PrgP`: Passes progressives
    """)