import os
import json
import re
from typing import List, Optional, Dict, Any
import requests

class SuperIntelligenceService:
    def __init__(self, investigations_path: str, domain_path: str):
        with open(investigations_path, "r", encoding="utf-8") as f:
            self.investigations = json.load(f)
        with open(domain_path, "r", encoding="utf-8") as f:
            self.domain = json.load(f)
        
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def retrieve_context(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        query_words = set(re.findall(r"\w+", query.lower()))
        scored = []
        for inv in self.investigations:
            text = f"{inv['name']} {inv['full_name']} {inv['objectives']} {inv['fuels']['materials']} {inv['key_findings']} {inv['hardware']} {inv['category']}".lower()
            tokens = set(re.findall(r"\w+", text))
            overlap = len(query_words.intersection(tokens))
            
            # Boost matches on specific keywords
            if any(k in query.lower() for k in ["cool flame", "cool flames"]) and "cool" in text:
                overlap += 5
            if any(k in query.lower() for k in ["smoke", "detector", "aerosol", "dust"]) and ("smoke" in text or "aerosol" in text):
                overlap += 5
            if any(k in query.lower() for k in ["saffire", "large", "scale"]) and "saffire" in text:
                overlap += 5
            if any(k in query.lower() for k in ["solid", "bass", "pmma", "fabric"]) and ("bass" in text or "solid" in text):
                overlap += 5
            if any(k in query.lower() for k in ["electric", "efield", "field"]) and "electric" in text:
                overlap += 5
            if any(k in query.lower() for k in ["artemis", "rover", "lunar", "moon"]) and ("exploration" in text or "loc" in text or "10.2" in text):
                overlap += 5

            scored.append((overlap, inv))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:top_k]]

    def answer_query(self, query: str) -> Dict[str, Any]:
        retrieved_invs = self.retrieve_context(query)
        citations = [
            {
                "id": inv["id"],
                "name": inv["name"],
                "hardware": inv["hardware"],
                "relevance_score": inv["relevance_score"],
                "citation_text": f"NASA PSI Repository & ISS Combustion Guide: {inv['full_name']} ({inv['hardware']})"
            }
            for inv in retrieved_invs
        ]

        # Check if an external LLM key is configured
        if self.anthropic_key:
            try:
                answer = self._call_anthropic(query, retrieved_invs)
                return {"answer": answer, "mode": "anthropic_llm", "citations": citations}
            except Exception as e:
                print(f"Anthropic API call failed: {e}, falling back to grounded synthesis")

        # Grounded Rule-Based Aerospace Intelligence Synthesis
        answer = self._synthesize_grounded_answer(query, retrieved_invs)
        return {
            "answer": answer,
            "mode": "grounded_si_synthesis",
            "citations": citations
        }

    def _synthesize_grounded_answer(self, query: str, retrieved: List[Dict[str, Any]]) -> str:
        q_lower = query.lower()
        
        # Check domain-specific themes
        if any(w in q_lower for w in ["mir", "apollo 1", "apollo 13", "history", "incident", "accident"]):
            incidents = self.domain["historical_incidents"]
            response = "### 🚀 Grounded Aerospace Incident Analysis & Lessons Learned\n\n"
            for inc in incidents:
                response += f"**{inc['mission']} ({inc['date']})**\n"
                response += f"- **Event:** {inc['incident']}\n"
                response += f"- **Space Safety Engineering Impact:** {inc['lessons_learned']}\n\n"
            response += "These historical catastrophes directly shaped NASA's rigorous **NASA-STD-6001** flammability criteria and the continuous microgravity experiments executed on the ISS and Cygnus vehicles.\n"
            return response

        if any(w in q_lower for w in ["spinoff", "earth", "firefighter", "turnout", "gear", "air tank", "scba"]):
            spinoffs = self.domain["earth_spinoffs"]
            response = "### 🚒 Terrestrial Benefits & NASA Fire Safety Spinoffs\n\n"
            for sp in spinoffs:
                response += f"#### **{sp['title']}**\n"
                response += f"- **NASA Space Origin:** {sp['nasa_origin']}\n"
                response += f"- **Commercial Adaptation:** {sp['commercial_adaptation']}\n"
                response += f"- **Earth Impact:** {sp['terrestrial_impact']}\n\n"
            return response

        if any(w in q_lower for w in ["artemis", "moon", "lunar", "rover", "exploration atmosphere", "10.2", "34%"]):
            atm = self.domain["exploration_atmospheres"]["regimes"]
            response = "### 🌕 Exploration Atmosphere Fire Dynamics (Artemis & Mars)\n\n"
            response += "In upcoming Artemis lunar surface habitats and pressurized rovers, the atmosphere will be configured to **10.2 psi (70.3 kPa) with ~34% O₂** (compared to Earth's 14.7 psi / 21% O₂).\n\n"
            response += "**Critical Fire Safety Findings from PSI Data:**\n"
            response += "1. **Increased Flammability:** Elevated oxygen concentrations (>30% O₂) dramatically lower the Limiting Oxygen Concentration (LOC) and ignition delay times for polymers and textiles, as verified by **ACME-BRE**.\n"
            response += "2. **Ventilation Sensitivity:** Under microgravity and low lunar gravity, fires rely on forced ventilation fans (1 to 20 cm/s). At 10.2 psi, slow airflow provides adequate convective oxidizer replenishment without convective blowoff.\n"
            response += "3. **Extinction Protocols:** As investigated in **BASS-II** and **Saffire**, traditional suppression thresholds must be scaled up, requiring higher carbon dioxide volume fractions or rapid depressurization/inert gas purging.\n"
            return response

        # General synthesis across retrieved investigations
        response = f"### 🔬 Super-Intelligence Synthesis for: *\"{query}\"*\n\n"
        response += f"Based on cross-referencing **{len(retrieved)} core NASA microgravity combustion investigations** from the Physical Sciences Informatics (PSI) repository and the ISS Combustion Science Guide:\n\n"
        
        for inv in retrieved:
            response += f"#### **{inv['name']} ({inv['full_name']})** — *Hardware: {inv['hardware']}*\n"
            response += f"- **Tested Fuels & Geometry:** {inv['fuels']['type']} — {', '.join(inv['fuels']['materials'])}\n"
            response += f"- **Atmospheric Matrix:** O₂ {inv['test_conditions']['oxygen_concentration_pct']}%, Pressure {inv['test_conditions']['pressure_psi']} psi, Flow speeds: {inv['test_conditions']['airflow_speed_cm_s']} cm/s\n"
            response += f"- **Key Finding:** {inv['key_findings']}\n"
            response += f"- **Fire Safety Impact:** {inv['fire_safety_relevance']['prevention']} | **Suppression:** {inv['fire_safety_relevance']['suppression']}\n\n"

        response += "**Engineering Takeaway for Spacecraft Design:**\n"
        response += "Microgravity suppresses buoyant thermal plumes, creating diffusion-dominated flame envelopes that are highly sensitive to internal cabin ventilation currents (0.5–25 cm/s). Spacecraft fire prevention requires calibrating detection optics specifically for larger microgravity smoke agglomerates (SAME-R findings) and factoring in elevated oxygen flammability boundaries."
        
        return response

    def _call_anthropic(self, query: str, retrieved: List[Dict[str, Any]]) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        context_str = json.dumps(retrieved, indent=2)
        domain_str = json.dumps(self.domain, indent=2)
        
        prompt = f"""You are the NASA Super-Intelligence (SI) Fire Safety Assistant for the 'Flame in Freefall' Challenge.
Your task is to provide rigorous, technical, aerospace-grade answers grounded strictly in the provided NASA PSI investigation data and domain knowledge.

Query: {query}

Retrieved NASA PSI Investigations:
{context_str}

Domain Knowledge (Exploration Atmospheres, Historical Incidents, Spinoffs):
{domain_str}

Instructions:
- Provide clear, direct, and cited answers using the investigation names (e.g. [BASS-II], [ACME-BRE], [Saffire-I], [SAME-R]).
- Explicitly explain microgravity combustion physics (lack of buoyancy, spherical flames, diffusion reliance, cool flames, soot formation).
- Relate findings to prevention, detection, suppression, and future Moon/Mars exploration atmospheres.
"""
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}]
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        data = resp.json()
        return data["content"][0]["text"]
