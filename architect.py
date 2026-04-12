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
        # print(f"⚠️ Note: {path} not loaded.") # اختياري للتصحيح
        return None

def architect_engine(vision, opt_id, lgt_id, clr_id, mat_id, comp_id, ang_id, env_id, domain_id, 
                     mot_id=None, mat_type="metal", env_type="studio"):
    
    # 1. تحميل كافة المجلدات الـ 15 (السيطرة الكاملة)
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
        # ملفات المجلد الخامس (التخصصات الشاملة)
        "d1": load_catalog('catalog/volume_05_01.json'),
        "d2": load_catalog('catalog/volume_05_02.json'),
        "d3": load_catalog('catalog/volume_05_03.json')
    }

    # 2. البحث الذكي عن التخصص (Universal Domain Search) 👈 متوافق مع Index.html
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

    # اختيار المادة (الديناميكي)
    m_src = cats['met'] if mat_type == "metal" else cats['liq'] if mat_type == "liquid" else cats['sft']
    # اختيار المادة (الديناميكي) - تعديل مرن لتجنب الأخطاء
    m_src = cats['met'] if mat_type == "metal" else cats['liq'] if mat_type == "liquid" else cats['sft']
    s_mat = None
    
    if m_src:
        # بنجرب كل المسميات المحتملة للدرج جوه ملف الـ JSON
        possible_keys = [f"{mat_type}_types", f"{mat_type}_materials", "materials", "metallic_materials", "liquid_types"]
        actual_key = next((k for k in possible_keys if k in m_src), None)
        
        if actual_key:
            s_mat = next((r for r in m_src[actual_key] if r['id'] == mat_id), None)

    # اختيار البيئة (الديناميكي)
    e_src = cats['stu'] if env_type == "studio" else cats['ext'] if env_type == "external" else cats['ind']
    e_key = f"{env_type}_setups" if env_type == "studio" else f"{env_type}_locations" if env_type == "external" else "industrial_sets"
    s_env = next((r for r in e_src[e_key] if r['id'] == env_id), None) if e_src else None

    # 4. نظام الإنذار المبكر (التحقق من الـ IDs)
    missing = []
    if not s_opt: missing.append(f"Optics:{opt_id}")
    if not s_dom: missing.append(f"Domain:{domain_id}")
    if not s_mat: missing.append(f"Material:{mat_id}")
    if not s_env: missing.append(f"Environment:{env_id}")
    
    if missing:
        return f"❌ Error: القواعد التالية غير موجودة في المخزن: {', '.join(missing)}"

    # 5. صياغة البرومبت الإمبراطوري النهائي
    s_mot = next((r for r in cats['mot']['camera_movements'] if r['id'] == mot_id), None) if mot_id and cats['mot'] else None
    motion_txt = f"\n[MOTION PATH]: {s_mot['name']} | {s_mot['vibe']}" if s_mot else "[FRAME]: Static Masterpiece"

    return f"""
### SYSTEM ROLE: CORTEX MASTER DIRECTOR (v3.0.0)
INDUSTRY PROTOCOL: {s_dom['id']} | Logic: {s_dom['logic']}

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
        # 1. بايثون بيسمع "صندوق البريد" اللي بعته النود جي اس
        if len(sys.argv) > 1:
            raw_data = sys.argv[1] # استلام الورقة (JSON)
            data = json.loads(raw_data) # فك الشفرة
            
            # 2. استخراج الاختيارات والمجال من الورقة
            selections = data.get('selections', {})
            domain = data.get('domain', {})
            
            # 3. تشغيل المحرك بتاعك بالبيانات اللي جاية من السيرفر
            # ملحوظة: إحنا بنقرأ الـ ID من السيرفر ونبعته للمحرك بتاعك
            result = architect_engine(
                vision=data.get('concept', 'Cinematic Shot'),
                domain_id=domain.get('id', 'General'), # المجال اللي المستخدم اختاره
                opt_id=selections.get('opt_id', 'OPT-01'), # العدسة اللي بايثون هيختارها
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
            
            # 4. "نطق" النتيجة عشان النود جي اس يسمعها
            print(result)
        else:
            print("Error: No data received")
            
    except Exception as e:
        # طباعة الخطأ بشكل بسيط ومباشر
        print(f"Python Error: {str(e)}")