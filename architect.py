import sys
import io
import json
import os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def load_catalog(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return None

def architect_engine(vision, opt_id, lgt_id, clr_id, mat_id, comp_id, ang_id, env_id, domain_id, 
                     mot_id=None, mat_type="metal", env_type="studio"):
    
    # 1. تحميل كافة المجلدات الـ 15
    cats = {
        "opt": load_catalog('catalog/volume_01.json'),
        "lgt": load_catalog('catalog/volume_01_02.json'),
        "clr": load_catalog('catalog/volume_01_03.json'),
        "met": load_catalog('catalog/volume_02_01.json'),
        "liq": load_catalog('catalog/volume_02_02.json'),
        "sft": load_catalog('catalog/volume_02_03.json'),
        "cmp": load_catalog('catalog/volume_03_01.json'),
        "ang": load_catalog('catalog/volume_03_02.json'),
        "mot": load_catalog('catalog/volume_03_03.json'),
        "stu": load_catalog('catalog/volume_04_01.json'),
        "ext": load_catalog('catalog/volume_04_02.json'),
        "ind": load_catalog('catalog/volume_04_03.json'),
        "d1": load_catalog('catalog/volume_05_01.json'),
        "d2": load_catalog('catalog/volume_05_02.json'),
        "d3": load_catalog('catalog/volume_05_03.json')
    }

    # 2. البحث الذكي عن التخصص
    s_dom = None
    for d_cat in [cats['d1'], cats['d2'], cats['d3']]:
        if d_cat and 'domains' in d_cat:
            found = next((r for r in d_cat['domains'] if r['id'] == domain_id), None)
            if found:
                s_dom = found
                break
    
    # 3. استخراج القواعد الأساسية والإخراجية
    s_opt = next((r for r in cats['opt']['optical_rules'] if r['id'] == opt_id), None) if cats['opt'] else None
    s_lgt = next((r for r in cats['lgt']['lighting_styles'] if r['id'] == lgt_id), None) if cats['lgt'] else None
    s_clr = next((r for r in cats['clr']['color_profiles'] if r['id'] == clr_id), None) if cats['clr'] else None
    s_cmp = next((r for r in cats['cmp']['geometry_rules'] if r['id'] == comp_id), None) if cats['cmp'] else None
    s_ang = next((r for r in cats['ang']['angle_definitions'] if r['id'] == ang_id), None) if cats['ang'] else None

    # اختيار المادة
    m_src = cats['met'] if mat_type == "metal" else cats['liq'] if mat_type == "liquid" else cats['sft']
    s_mat = None
    if m_src:
        possible_keys = [f"{mat_type}_types", f"{mat_type}_materials", "materials", "metallic_materials", "liquid_types"]
        actual_key = next((k for k in possible_keys if k in m_src), None)
        if actual_key:
            s_mat = next((r for r in m_src[actual_key] if r['id'] == mat_id), None)

    # اختيار البيئة
    e_src = cats['stu'] if env_type == "studio" else cats['ext'] if env_type == "external" else cats['ind']
    e_key = f"{env_type}_setups" if env_type == "studio" else f"{env_type}_locations" if env_type == "external" else "industrial_sets"
    s_env = next((r for r in e_src[e_key] if r['id'] == env_id), None) if e_src else None

    # =========================================================================
    # 4. 🚀 بروتوكول الطوارئ (Universal Fallback) بدلاً من إيقاف المحرك
    # =========================================================================
    fallback_notes = []
    
    if not s_opt:
        s_opt = {"category": "Standard 50mm Prime", "focal_length": "50mm"}
        fallback_notes.append("Optics")
    if not s_lgt:
        s_lgt = {"name": "Balanced Studio Light (5500K)"}
    if not s_clr:
        s_clr = {"name": "Standard ACES Profile"}
    if not s_cmp:
        s_cmp = {"name": "Centered Balanced Composition"}
    if not s_ang:
        s_ang = {"name": "Eye-level Neutral Angle"}
    if not s_dom:
        s_dom = {"id": domain_id or "General", "logic": "Universal adaptation based on core visual elements", "keywords": "clean, balanced, high-resolution, photorealistic"}
        fallback_notes.append(f"Domain({domain_id})")
    if not s_mat:
        s_mat = {"name": f"Generic {mat_type.capitalize()} Material"}
        fallback_notes.append(f"Material({mat_id})")
    if not s_env:
        # بدل ما نحط STU-01، هنحط إشارة إن الخلفية "سينمائية حرة"
        s_env = {
            "id": "ENV-DYNAMIC", 
            "name": "NARRATIVE_DRIVEN_BACKGROUND", 
            "atmosphere": "Defined by Claude's Creative Vision"
        }
        fallback_notes.append("Environment(Dynamic)")

    # إشعار للخبراء الآخرين لتفعيل خيالهم إذا تم استخدام بروتوكول الطوارئ
    system_alert = f"\n[SYSTEM ALERT]: Fallback generic data activated for ({', '.join(fallback_notes)}). Claude & DeepSeek must override with domain-specific creativity." if fallback_notes else ""

    # =========================================================================
    # 5. صياغة البرومبت الإمبراطوري النهائي
    # =========================================================================
    s_mot = next((r for r in cats['mot']['camera_movements'] if r['id'] == mot_id), None) if mot_id and cats['mot'] else None
    motion_txt = f"\n[MOTION PATH]: {s_mot['name']} | {s_mot['vibe']}" if s_mot else "[FRAME]: Static Masterpiece"

    return f"""
### SYSTEM ROLE: CORTEX MASTER DIRECTOR (v3.0.0)
INDUSTRY PROTOCOL: {s_dom['id']} | Logic: {s_dom['logic']}{system_alert}

DIRECTOR'S VISION: "{vision}"

[SPECIALIST KEYWORDS]: {s_dom['keywords']}
[CINEMATOGRAPHY]: {s_opt['category']} ({s_opt['focal_length']}) | {s_ang['name']} | {s_cmp['name']}
[ENVIRONMENT]: {s_env['name']} | Atmosphere: {s_env.get('atmosphere', 'Clean')}
[LIGHT & COLOR]: {s_lgt['name']} | {s_clr['name']} | ACES Workflow
[PHYSICS]: {s_mat['name']} ({mat_type.upper()}) | {motion_txt}

FINAL INSTRUCTION: Synthesize with surgical precision for professional production.
"""

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            raw_data = sys.argv[1] 
            data = json.loads(raw_data) 
            
            selections = data.get('selections', {})
            domain = data.get('domain', {})
            
            result = architect_engine(
                vision=data.get('concept', 'Cinematic Shot'),
                domain_id=domain.get('id', 'General'), 
                opt_id=selections.get('opt_id', 'OPT-01'), 
                lgt_id=selections.get('lgt_id', 'LGT-01'),
                clr_id=selections.get('clr_id', 'CLR-01'),
                mat_id=selections.get('mat_id', 'MET-01'),
                comp_id=selections.get('comp_id', 'COMP-01'),
                ang_id=selections.get('ang_id', 'ANG-01'),
                env_id=selections.get('env_id', 'STU-01'),
                mot_id=selections.get('mot_id', 'MOT-01'),
                mat_type=selections.get('mat_type', 'metal'),
                env_type=selections.get('env_type', 'studio')
            )
            
            print(result)
        else:
            print("Error: No data received")
            
    except Exception as e:
        print(f"Python Error: {str(e)}")