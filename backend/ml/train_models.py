
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os
import random

# Ensure output directory exists
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def generate_synthetic_data(n_samples=5000):
    """
    Generate synthetic data for NSQF level prediction
    Features: Education, Experience (years), Skills Count, Target Career
    Target: NSQF Level (1-10)
    """
    
    education_levels = [
        "no_formal_education", "primary", "secondary", "higher_secondary", 
        "diploma", "bachelors", "masters", "phd", "post_doc"
    ]
    
    career_targets = [
        "entry_level", "junior_developer", "mid_level", "senior_developer",
        "tech_lead", "architect", "manager", "director", "cto", 
        "data_scientist", "ui_ux_designer", "mobile_developer"
    ]
    
    data = []
    
    # Base level mapping for logic consistency
    edu_map = {
        "no_formal_education": 1, "primary": 1, "secondary": 2, "higher_secondary": 3,
        "diploma": 4, "bachelors": 5, "masters": 7, "phd": 8, "post_doc": 9
    }
    
    for _ in range(n_samples):
        # Random features
        education = random.choice(education_levels)
        experience = random.randint(0, 20)
        skills_count = random.randint(0, 15)
        # Higher probability for relevant careers
        if education in ["bachelors", "masters", "phd"]:
             target_career = random.choice(career_targets[3:]) 
        else:
             target_career = random.choice(career_targets[:5])
        
        # Rule-based logic with noise for realistic ML training
        base_level = edu_map[education]
        
        # Experience boost
        if experience <= 1: exp_boost = 0
        elif experience <= 3: exp_boost = 1
        elif experience <= 5: exp_boost = 2
        elif experience <= 10: exp_boost = 3
        else: exp_boost = 4
        
        # Skills boost
        skills_boost = min(skills_count // 3, 3)
        
        # Calculate raw level
        raw_level = base_level + exp_boost + skills_boost
        
        # Add some random noise (-1, 0, +1)
        noise = random.choice([-1, 0, 0, 0, 1]) 
        final_level = max(1, min(10, raw_level + noise))
        
        data.append({
            "education": education,
            "experience": experience,
            "skills_count": skills_count,
            "target_career": target_career,
            "nsqf_level": final_level
        })
        
    return pd.DataFrame(data)

def train_nsqf_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data()
    
    print("Preprocessing data...")
    # Encode categorical variables
    le_education = LabelEncoder()
    df['education_encoded'] = le_education.fit_transform(df['education'])
    
    le_career = LabelEncoder()
    df['target_career_encoded'] = le_career.fit_transform(df['target_career'])
    
    # Features and Target
    X = df[['education_encoded', 'experience', 'skills_count', 'target_career_encoded']]
    y = df['nsqf_level']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    score = model.score(X_test, y_test)
    print(f"Model Accuracy: {score:.2f}")
    
    # Save model and encoders
    print("Saving models...")
    joblib.dump(model, os.path.join(MODELS_DIR, 'nsqf_model.pkl'))
    joblib.dump(le_education, os.path.join(MODELS_DIR, 'le_education.pkl'))
    joblib.dump(le_career, os.path.join(MODELS_DIR, 'le_career.pkl'))
    
    print("Training complete! Models saved to backend/ml/models/")

if __name__ == "__main__":
    train_nsqf_model()
