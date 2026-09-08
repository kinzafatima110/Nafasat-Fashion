import os
import re
import json
import shutil
import struct
import zipfile
import xml.etree.ElementTree as ET

BASE_SOURCE = "/Users/kfatima/Documents/Nafasat/Rental pics/Rental pics"
TARGET_DIR = "/Users/kfatima/Documents/Nafasat/nafasat-catalogue-web"
TARGET_IMAGES = os.path.join(TARGET_DIR, "assets", "images")
TARGET_DATA = os.path.join(TARGET_DIR, "data")
EXCEL_FOLDER = "/Users/kfatima/Documents/Nafasat"

CATEGORY_DIRS = [
    {
        "category_id": "rental-bridal",
        "category_name": "Bridal Wear",
        "prefix": "NRFAB",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_updated_index", "rental-bridal"),
        "dest_subdir": "rental-bridal"
    },
    {
        "category_id": "female-partywear",
        "category_name": "Party Wear",
        "prefix": "NRFAP",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_updated_index", "female-partywear"),
        "dest_subdir": "female-partywear"
    },
    {
        "category_id": "jewelry",
        "category_name": "Jewelry",
        "prefix": "NRFJ",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_updated_index", "Female Jewellery"),
        "dest_subdir": "jewelry"
    },
    {
        "category_id": "kids-rental",
        "category_name": "Girls Rental",
        "prefix": "NRFK",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_updated_index", "kids-rental"),
        "dest_subdir": "kids-rental"
    },
    {
        "category_id": "kids-coatpant",
        "category_name": "Boys Coat-Pants",
        "prefix": "NRMK",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_updated_index", "kids-coatpant"),
        "dest_subdir": "kids-coatpant"
    },
    {
        "category_id": "saree",
        "category_name": "Sarees",
        "prefix": "SAREE",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_correct_images", "saree"),
        "dest_subdir": "saree"
    },
    {
        "category_id": "purses",
        "category_name": "Clutches & Purses",
        "prefix": "PURSE",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_correct_images", "purses"),
        "dest_subdir": "purses"
    },
    {
        "category_id": "shoes",
        "category_name": "Footwear",
        "prefix": "SHOE",
        "source_dir": os.path.join(BASE_SOURCE, "nafas_catalogue_with_correct_images", "shoes"),
        "dest_subdir": "shoes"
    }
]

def get_image_dimensions(file_path):
    try:
        with open(file_path, 'rb') as f:
            data = f.read(2)
            if data != b'\xff\xd8':
                return None, None
            while True:
                buf = f.read(4)
                if len(buf) < 4:
                    return None, None
                marker, length = struct.unpack('>2sH', buf)
                if marker in [b'\xff\xc0', b'\xff\xc2']:
                    f.read(1)
                    h, w = struct.unpack('>HH', f.read(4))
                    return w, h
                f.seek(length - 2, 1)
    except:
        return None, None

def read_xlsx_rows(file_path):
    if not os.path.exists(file_path):
        return []
    try:
        with zipfile.ZipFile(file_path) as z:
            shared = []
            if 'xl/sharedStrings.xml' in z.namelist():
                tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    text = ''.join([t.text or '' for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                    shared.append(text)
            
            sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
            rows = []
            for r in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_data = {}
                for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    ref = c.attrib.get('r', '')
                    col = ''.join(filter(str.isalpha, ref))
                    t = c.attrib.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else ''
                    if t == 's' and val.isdigit() and int(val) < len(shared):
                        val = shared[int(val)]
                    row_data[col] = val.strip()
                if any(row_data.values()):
                    rows.append(row_data)
            return rows
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []

def load_all_metadata():
    metadata = {}

    # 1. Master Sheet
    master = read_xlsx_rows(os.path.join(EXCEL_FOLDER, 'Master Sheet for Bridal And rental dresses.xlsx'))
    for r in master[1:]:
        code = r.get('B', '').upper().replace(' ', '')
        if code and code not in ['CODE', 'S.NO']:
            metadata[code] = {
                'color': r.get('D', '').strip(),
                'size': r.get('E', '').strip(),
                'rent': r.get('F', '').strip(),
                'deposit': r.get('G', '').strip(),
                'description': r.get('C', '').strip()
            }

    # 2. Bridal sheet
    bridal = read_xlsx_rows(os.path.join(EXCEL_FOLDER, 'Bridal Dresses(NRFAB00001xxxxxS).xlsx'))
    for r in bridal:
        code = r.get('C', '').upper().replace(' ', '')
        if code and code.startswith('NRFAB'):
            cur = metadata.get(code, {})
            cur['color'] = r.get('D', cur.get('color', '')).strip()
            cur['size'] = r.get('E', cur.get('size', '')).strip()
            cur['rent'] = r.get('F', cur.get('rent', '')).strip()
            cur['deposit'] = r.get('G', cur.get('deposit', '')).strip()
            cur['description'] = r.get('H', cur.get('description', '')).strip()
            metadata[code] = cur

    # 3. Party Wear sheet
    party = read_xlsx_rows(os.path.join(EXCEL_FOLDER, 'Female Party Wear(NRFAP00001xxxxxsS).xlsx'))
    for r in party:
        code = r.get('C', '').upper().replace(' ', '')
        if code and code.startswith('NRFAP'):
            cur = metadata.get(code, {})
            cur['color'] = r.get('D', cur.get('color', '')).strip()
            cur['size'] = r.get('E', cur.get('size', '')).strip()
            cur['rent'] = r.get('H', cur.get('rent', '')).strip()
            cur['deposit'] = r.get('I', cur.get('deposit', '')).strip()
            cur['description'] = r.get('F', cur.get('description', '')).strip()
            metadata[code] = cur

    # 4. Kids Girls
    girls = read_xlsx_rows(os.path.join(EXCEL_FOLDER, 'kids Girls rental dresses(NRFK00001xxxxS).xlsx'))
    for r in girls:
        code = r.get('C', '').upper().replace(' ', '')
        if code and code.startswith('NRFK'):
            cur = metadata.get(code, {})
            cur['color'] = r.get('D', cur.get('color', '')).strip()
            cur['size'] = r.get('E', cur.get('size', '')).strip()
            cur['rent'] = r.get('H', cur.get('rent', '')).strip()
            cur['deposit'] = r.get('I', cur.get('deposit', '')).strip()
            cur['description'] = r.get('F', cur.get('description', '')).strip()
            metadata[code] = cur

    # 5. Kids Boys
    boys = read_xlsx_rows(os.path.join(EXCEL_FOLDER, 'Kids Boys Coat Pants(NRMK00001xxxxS).xlsx'))
    for r in boys:
        code = r.get('C', '').upper().replace(' ', '')
        if code and code.startswith('NRMK'):
            cur = metadata.get(code, {})
            cur['color'] = r.get('D', cur.get('color', '')).strip()
            cur['size'] = r.get('E', cur.get('size', '')).strip()
            cur['rent'] = r.get('F', cur.get('rent', '')).strip()
            cur['deposit'] = r.get('G', cur.get('deposit', '')).strip()
            metadata[code] = cur

    print(f"Total mapped SKUs in metadata dictionary: {len(metadata)}")
    return metadata

def standardize_color(raw_color):
    if not raw_color:
        return "Standard"
    c = raw_color.lower()
    if any(k in c for k in ['maroon', 'red', 'blood', 'ruby', 'crimson', 'rust']):
        return "Red & Maroon"
    elif any(k in c for k in ['pink', 'peach', 'blush', 'rose', 'coral', 'magenta', 'fuchsia']):
        return "Pink & Peach"
    elif any(k in c for k in ['blue', 'ferozi', 'navy', 'sky', 'teal', 'royal']):
        return "Blue & Ferozi"
    elif any(k in c for k in ['green', 'dhani', 'bottle', 'sea green', 'mint', 'emerald', 'olive', 'pary wear']):
        return "Green & Emerald"
    elif any(k in c for k in ['yellow', 'gold', 'mustard', 'lemon', 'fone', 'khaki', 'tan']):
        return "Gold & Yellow"
    elif any(k in c for k in ['white', 'silver', 'ivory', 'off white', 'skin', 'zinc', 'cream', 'grey', 'gray']):
        return "White & Silver"
    elif 'black' in c:
        return "Black"
    elif any(k in c for k in ['purple', 'plum', 'violet', 'lavender', 'lilac']):
        return "Purple & Plum"
    else:
        return "Multi & Other"

def standardize_size(raw_size):
    if not raw_size:
        return "Free Size"
    s = raw_size.lower().strip()
    if s in ['small', 's', 'sm'] or 'small' in s:
        return "Small"
    elif s in ['medium', 'm', 'med'] or 'med' in s:
        return "Medium"
    elif s in ['large', 'l', 'lg'] or 'large' in s:
        return "Large"
    elif s in ['xl', 'extra large', 'xxl']:
        return "XL"
    elif re.search(r'\b(24|26|28|30|32|34|36|38|40)\b', s):
        match = re.search(r'\b(24|26|28|30|32|34|36|38|40)\b', s)
        val = int(match.group(1))
        if val <= 34:
            return f"Kids ({val})"
        elif val == 36:
            return "Small (36)"
        elif val == 38:
            return "Medium (38)"
        else:
            return "Large (40)"
    elif 'suit' in s:
        return "Suit Standard"
    else:
        return "Free Size"

def clean_sku(filename):
    name, _ = os.path.splitext(filename.strip())
    name = name.strip()
    match = re.match(r"^(.+?)\s*\(\d+\)$", name)
    sku = match.group(1).strip() if match else name
    if re.match(r"^[a-zA-Z]{4,6}\d+$", sku):
        sku = sku.upper()
    return sku

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]

def select_dummy_image(image_files, dest_full_dir):
    """
    Intelligently select the full dummy (mannequin) photo:
    1. If any image has tall ratio (h/w >= 2.0), that is the cropped full-length dummy!
    2. Prefer (2) then (1) for front view.
    """
    if len(image_files) <= 1:
        return image_files

    # 1. Check for tall cropped dummy images
    tall_images = []
    for f in image_files:
        full_path = os.path.join(dest_full_dir, f)
        w, h = get_image_dimensions(full_path)
        r = (h / w) if w and h else 1.0
        if r >= 2.0:
            tall_images.append((f, r))

    if tall_images:
        def tall_priority(item):
            fn, r = item
            if '(2)' in fn: return 0
            if '(1)' in fn: return 1
            return 2
        tall_images.sort(key=tall_priority)
        best_dummy = tall_images[0][0]
        remaining = [f for f in image_files if f != best_dummy]
        return [best_dummy] + remaining

    # 2. Standard ratio photos: prefer (2) then (1)
    has_two = [f for f in image_files if '(2)' in f]
    if has_two:
        best_dummy = has_two[0]
        remaining = [f for f in image_files if f != best_dummy]
        return [best_dummy] + remaining

    return image_files

def build():
    os.makedirs(TARGET_IMAGES, exist_ok=True)
    os.makedirs(TARGET_DATA, exist_ok=True)
    os.makedirs(os.path.join(TARGET_DIR, "assets"), exist_ok=True)

    # Copy logo
    logo_src = os.path.join(BASE_SOURCE, "nafas_catalogue_with_updated_index", "logo.png")
    if not os.path.exists(logo_src):
        logo_src = os.path.join(BASE_SOURCE, "logo.png")
    if os.path.exists(logo_src):
        shutil.copy2(logo_src, os.path.join(TARGET_DIR, "assets", "logo.png"))
        print("Copied logo.png to assets/logo.png")

    meta_dict = load_all_metadata()

    catalog = {
        "categories": [],
        "products": [],
        "available_colors": [],
        "available_sizes": []
    }

    product_id_counter = 1
    total_images_copied = 0
    all_standard_colors = set()
    all_standard_sizes = set()

    for cat in CATEGORY_DIRS:
        source_dir = cat["source_dir"]
        dest_subdir = cat["dest_subdir"]
        dest_full = os.path.join(TARGET_IMAGES, dest_subdir)
        os.makedirs(dest_full, exist_ok=True)

        if not os.path.exists(source_dir):
            print(f"Warning: source directory not found: {source_dir}")
            continue

        print(f"Processing category: {cat['category_name']}...")

        files_by_sku = {}
        for fname in sorted(os.listdir(source_dir), key=natural_sort_key):
            if fname.startswith(".") or not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue

            src_file = os.path.join(source_dir, fname)
            if not os.path.isfile(src_file):
                continue

            sku = clean_sku(fname)
            if sku not in files_by_sku:
                files_by_sku[sku] = []
            files_by_sku[sku].append(fname)

            # Copy to target assets
            dest_file = os.path.join(dest_full, fname)
            if not os.path.exists(dest_file):
                shutil.copy2(src_file, dest_file)
                total_images_copied += 1

        cat_count = len(files_by_sku)
        catalog["categories"].append({
            "id": cat["category_id"],
            "name": cat["category_name"],
            "count": cat_count
        })

        for sku, raw_image_files in files_by_sku.items():
            sorted_image_files = select_dummy_image(raw_image_files, dest_full)
            image_rel_paths = [f"assets/images/{dest_subdir}/{f}" for f in sorted_image_files]
            
            clean_sku_key = sku.upper().replace(' ', '')
            meta = meta_dict.get(clean_sku_key, {})

            raw_color = meta.get('color', '')
            raw_size = meta.get('size', '')
            rent_val = meta.get('rent', '')
            deposit_val = meta.get('deposit', '')
            desc_val = meta.get('description', '')

            std_color = standardize_color(raw_color)
            std_size = standardize_size(raw_size)

            if std_color and std_color != "Standard":
                all_standard_colors.add(std_color)
            if std_size:
                all_standard_sizes.add(std_size)

            if sku.startswith("NRFAB"):
                title = f"Bridal Ensemble {sku}"
            elif sku.startswith("NRFAP"):
                title = f"Party Wear {sku}"
            elif sku.startswith("NRFJ"):
                title = f"Jewelry Set {sku}"
            elif sku.startswith("NRFK"):
                title = f"Girl's Festive Dress {sku}"
            elif sku.startswith("NRMK"):
                title = f"Boy's Coat-Pant {sku}"
            elif cat["category_id"] == "saree":
                title = f"Designer Saree {sku}"
            elif cat["category_id"] == "purses":
                title = f"Bridal Clutch / Purse {sku}"
            elif cat["category_id"] == "shoes":
                title = f"Special Occasion Footwear {sku}"
            else:
                title = f"Designer Outfit {sku}"

            catalog["products"].append({
                "id": product_id_counter,
                "sku": sku,
                "title": title,
                "category_id": cat["category_id"],
                "category_name": cat["category_name"],
                "color": raw_color or "Standard",
                "standard_color": std_color,
                "size": raw_size or "Standard",
                "standard_size": std_size,
                "rent": rent_val,
                "deposit": deposit_val,
                "description": desc_val or "Rental dress / accessory at Nafasat.",
                "primary_image": image_rel_paths[0], # Dummy photo on top!
                "images": image_rel_paths,
                "image_count": len(image_rel_paths)
            })
            product_id_counter += 1

    catalog["available_colors"] = sorted(list(all_standard_colors))
    catalog["available_sizes"] = sorted(list(all_standard_sizes))

    json_path = os.path.join(TARGET_DATA, "products.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    print(f"\nSuccessfully built catalog with metadata and dummy photo prioritization!")
    print(f"Total Unique Products: {len(catalog['products'])}")
    print(f"Colors ({len(catalog['available_colors'])}): {catalog['available_colors']}")
    print(f"Sizes ({len(catalog['available_sizes'])}): {catalog['available_sizes']}")

if __name__ == "__main__":
    build()
