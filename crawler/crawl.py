import argparse
import json
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://sidatagrun-public-1076756628210.asia-southeast2.run.app"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml",
}

PTN_CATEGORIES = {
    "akademik": "ptn_sn.php",
    "vokasi": "ptn_sn.php?ptn=-2",
    "ptkin": "ptn_sn.php?ptn=-3",
}

SELECTIONS = {
    "snbp": "ptn_sn.php",
    "snbt": "ptn_sb.php",
}

DEFAULT_OUT = Path(__file__).resolve().parent.parent / "dashboard" / "public" / "data"

_thread_local = threading.local()


def now():
    return time.strftime("%Y-%m-%d %H:%M:%S")


def get_session():
    session = getattr(_thread_local, "session", None)
    if session is None:
        session = requests.Session()
        session.headers.update(HEADERS)
        _thread_local.session = session
    return session


def parse_query(url, key):
    values = parse_qs(urlparse(url).query)
    found = values.get(key)
    return found[0] if found else None


def parse_int(text):
    if text is None:
        return None
    text = text.strip().replace(".", "").replace(",", "")
    if not text or not text.isdigit():
        return None
    return int(text)


def fetch(session, url, retries=4, base_delay=0.4):
    last_error = None
    for attempt in range(retries):
        try:
            response = session.get(url, timeout=30)
            if response.status_code == 200:
                return response.text
            last_error = f"HTTP {response.status_code}"
        except requests.RequestException as exc:
            last_error = str(exc)
        time.sleep(base_delay * (attempt + 1))
    raise RuntimeError(f"gagal mengambil {url}: {last_error}")


def find_prodi_table(soup):
    for table in soup.find_all("table"):
        thead = table.find("thead")
        if thead and "JENIS PORTOFOLIO" in thead.get_text().upper():
            return table
    return None


def find_panel_body(soup, title):
    title_upper = title.upper()
    for panel in soup.select("div.panel"):
        heading = panel.find("div", class_="panel-heading")
        if heading and title_upper in heading.get_text().upper():
            body = panel.find("div", class_="panel-body")
            if body:
                return body
    return None


def parse_ptn_list(html, kategori):
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for tr in soup.select("table.table-striped tbody tr"):
        tds = tr.find_all("td")
        if len(tds) < 6:
            continue
        kode_link = tds[1].find("a")
        if not kode_link:
            continue
        ptn_id = parse_query(kode_link.get("href", ""), "ptn")
        nama_link = tds[2].find("a")
        nama = nama_link.get_text(strip=True) if nama_link else tds[2].get_text(strip=True)
        website_link = tds[2].find("a", target="_blank")
        website = website_link.get("href", "") if website_link else ""
        results.append(
            {
                "id": ptn_id,
                "kode": kode_link.get_text(strip=True),
                "nama": nama,
                "website": website,
                "kab_kota": tds[3].get_text(strip=True),
                "provinsi_1": tds[4].get_text(strip=True),
                "provinsi_2": tds[5].get_text(strip=True),
                "kategori": kategori,
            }
        )
    return results


def parse_prodi_list(html, ptn_id, seleksi):
    soup = BeautifulSoup(html, "html.parser")
    table = find_prodi_table(soup)
    if not table:
        return []
    header = [th.get_text(strip=True).upper() for th in table.select("thead th")]
    results = []
    for tr in table.select("tbody tr"):
        tds = tr.find_all("td")
        if len(tds) < 6:
            continue
        nama_link = tds[2].find("a")
        if not nama_link:
            continue
        href = nama_link.get("href", "")
        prodi_id = parse_query(href, "prodi")
        results.append(
            {
                "ptn_id": ptn_id,
                "seleksi": seleksi,
                "prodi_id": prodi_id,
                "kode": tds[1].get_text(strip=True),
                "nama": nama_link.get_text(strip=True),
                "jenjang": tds[3].get_text(strip=True),
                "daya_tampung": parse_int(tds[4].get_text(strip=True)),
                "peminat": parse_int(tds[5].get_text(strip=True)),
                "portofolio": tds[6].get_text(strip=True) if len(tds) > 6 else "",
                "label_daya_tampung": header[4] if len(header) > 4 else "",
                "label_peminat": header[5] if len(header) > 5 else "",
            }
        )
    return results


def parse_sebaran(soup):
    body = find_panel_body(soup, "SEBARAN DATA")
    result = {}
    if not body:
        return result
    table = body.find("table")
    if not table:
        return result
    years = [th.get_text(strip=True) for th in table.select("thead th")[1:]]
    for row in table.select("tbody tr"):
        tds = row.find_all("td")
        label = tds[0].get_text(strip=True) if tds else ""
        cells = tds[1:]
        for year, cell in zip(years, cells):
            entry = result.setdefault(year, {})
            if label == "Jumlah Peminat":
                entry["peminat"] = parse_int(cell.get_text(strip=True))
            elif label == "Daya Tampung":
                full = cell.get_text(strip=True)
                match_num = re.match(r"(\d+)", full)
                match_pct = re.search(r"\(([\d.]+)%\)", full)
                entry["daya_tampung"] = int(match_num.group(1)) if match_num else None
                entry["persentase"] = float(match_pct.group(1)) if match_pct else None
    return result


def parse_peminat_per_prov(soup):
    body = find_panel_body(soup, "PEMINAT PER PROV")
    result = {}
    if not body:
        return result
    table = body.find("table")
    if not table:
        return result
    years = [th.get_text(strip=True) for th in table.select("thead th")[1:]]
    for row in table.select("tbody tr"):
        tds = row.find_all("td")
        if not tds:
            continue
        prov = tds[0].get_text(strip=True)
        result[prov] = {
            year: parse_int(cell.get_text(strip=True))
            for year, cell in zip(years, tds[1:])
        }
    return result


def parse_prodi_detail(html, ptn_id, prodi_id, seleksi):
    soup = BeautifulSoup(html, "html.parser")
    info = {}
    body = find_panel_body(soup, "INFORMASI UMUM")
    if body:
        for tr in body.select("table tr"):
            tds = tr.find_all("td")
            if len(tds) >= 2:
                key = tds[0].get_text(strip=True).lower().replace(" ", "_")
                info[key] = tds[1].get_text(strip=True)
    record = {
        "ptn_id": ptn_id,
        "seleksi": seleksi,
        "prodi_id": prodi_id,
        "kode": info.get("kode"),
        "nama": info.get("nama"),
        "jenjang": info.get("jenjang"),
        "portofolio": info.get("jenis_portofolio"),
        "sebaran": parse_sebaran(soup),
        "peminat_per_prov": parse_peminat_per_prov(soup) if seleksi == "snbt" else {},
    }
    return record


def load_items(path):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return list(data.get("items", []))
    return []


def save_json(path, items, label=""):
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "crawled_at": now(),
        "count": len(items),
        "items": items,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)


def crawl_ptn(session, out_dir):
    all_ptn = []
    for kategori, page in PTN_CATEGORIES.items():
        url = f"{BASE_URL}/{page}"
        html = fetch(session, url)
        items = parse_ptn_list(html, kategori)
        print(f"[ptn] {kategori}: {len(items)} PTN")
        all_ptn.extend(items)
    save_json(out_dir / "ptn.json", all_ptn)
    return all_ptn


def crawl_prodi_list(session, ptn, seleksi, delay):
    url = f"{BASE_URL}/{SELECTIONS[seleksi]}?ptn={ptn['id']}"
    html = fetch(session, url)
    items = parse_prodi_list(html, ptn["id"], seleksi)
    time.sleep(delay)
    return items


def crawl_prodi_lists(session, ptn_list, seleksi, out_dir, delay, limit):
    all_items = []
    target = ptn_list[:limit] if limit else ptn_list
    for index, ptn in enumerate(target, 1):
        try:
            items = crawl_prodi_list(session, ptn, seleksi, delay)
        except Exception as exc:
            print(f"[{seleksi}] list error {ptn['id']} {ptn['nama']}: {exc}")
            items = []
        all_items.extend(items)
        if index % 10 == 0 or index == len(target):
            print(f"[{seleksi}] prodi list {index}/{len(target)} -> total {len(all_items)} prodi")
    save_json(out_dir / f"prodi_{seleksi}.json", all_items)
    return all_items


def crawl_details(session, prodi_items, seleksi, out_dir, workers, delay, resume, limit):
    out_path = out_dir / f"detail_{seleksi}.json"
    existing = load_items(out_path) if resume else []
    done = {(d["ptn_id"], d["prodi_id"]) for d in existing}
    todo = [p for p in prodi_items if (p["ptn_id"], p["prodi_id"]) not in done]
    if limit:
        todo = todo[:limit]
    print(f"[{seleksi}] detail: {len(existing)} selesai, {len(todo)} tersisa")

    def one_task(prodi):
        url = f"{BASE_URL}/{SELECTIONS[seleksi]}?ptn={prodi['ptn_id']}&prodi={prodi['prodi_id']}&jenis=0"
        html = fetch(session, url)
        time.sleep(delay)
        return parse_prodi_detail(html, prodi["ptn_id"], prodi["prodi_id"], seleksi)

    if workers > 1:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(one_task, prodi): prodi for prodi in todo}
            for index, future in enumerate(as_completed(futures), 1):
                prodi = futures[future]
                try:
                    existing.append(future.result())
                except Exception as exc:
                    print(f"[{seleksi}] detail error {prodi['ptn_id']}/{prodi['prodi_id']}: {exc}")
                if index % 25 == 0 or index == len(futures):
                    save_json(out_path, existing)
                    print(f"[{seleksi}] detail progress {index}/{len(futures)} -> {len(existing)} total")
    else:
        for index, prodi in enumerate(todo, 1):
            try:
                existing.append(one_task(prodi))
            except Exception as exc:
                print(f"[{seleksi}] detail error {prodi['ptn_id']}/{prodi['prodi_id']}: {exc}")
            if index % 25 == 0 or index == len(todo):
                save_json(out_path, existing)
                print(f"[{seleksi}] detail progress {index}/{len(todo)} -> {len(existing)} total")

    save_json(out_path, existing)
    return existing


def write_meta(out_dir, ptn, snbp_prodi, snbt_prodi, snbp_detail, snbt_detail):
    payload = {
        "crawled_at": now(),
        "ptn": len(ptn),
        "prodi_snbp": len(snbp_prodi),
        "prodi_snbt": len(snbt_prodi),
        "detail_snbp": len(snbp_detail),
        "detail_snbt": len(snbt_detail),
    }
    save_json(out_dir / "meta.json", [], label="meta")
    with open(out_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)


def main():
    parser = argparse.ArgumentParser(description="Crawler data daya tampung SNBP/SNBT")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="direktori output JSON")
    parser.add_argument("--ptn-only", action="store_true", help="hanya crawl daftar PTN")
    parser.add_argument("--skip-detail", action="store_true", help="lewati crawl detail prodi")
    parser.add_argument("--skip-list", action="store_true", help="pakai file prodi_*.json yang sudah ada")
    parser.add_argument("--limit-ptn", type=int, default=None, help="batasi jumlah PTN untuk list prodi")
    parser.add_argument("--limit-detail", type=int, default=None, help="batasi jumlah detail prodi")
    parser.add_argument("--workers", type=int, default=1, help="jumlah thread paralel")
    parser.add_argument("--delay", type=float, default=0.3, help="jeda antar request (detik)")
    parser.add_argument("--no-resume", action="store_true", help="jangan lanjutkan dari hasil sebelumnya")
    args = parser.parse_args()

    out_dir = args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    session = get_session()

    print("== Crawl daftar PTN ==")
    ptn_list = crawl_ptn(session, out_dir)

    if args.ptn_only:
        print(f"Selesai. {len(ptn_list)} PTN tersimpan di {out_dir}")
        return

    results = {"snbp_prodi": [], "snbt_prodi": [], "snbp_detail": [], "snbt_detail": []}

    for seleksi in SELECTIONS:
        if args.skip_list:
            prodi_list = load_items(out_dir / f"prodi_{seleksi}.json")
            print(f"[{seleksi}] pakai file prodi list: {len(prodi_list)} prodi")
        else:
            print(f"== Crawl daftar prodi {seleksi.upper()} ==")
            prodi_list = crawl_prodi_lists(session, ptn_list, seleksi, out_dir, args.delay, args.limit_ptn)
        results[f"{seleksi}_prodi"] = prodi_list

        if not args.skip_detail:
            print(f"== Crawl detail prodi {seleksi.upper()} ==")
            detail_list = crawl_details(
                session, prodi_list, seleksi, out_dir, args.workers, args.delay, not args.no_resume, args.limit_detail
            )
            results[f"{seleksi}_detail"] = detail_list
        else:
            print(f"== Skip detail {seleksi.upper()} ==")

    write_meta(
        out_dir,
        ptn_list,
        results["snbp_prodi"],
        results["snbt_prodi"],
        results["snbp_detail"],
        results["snbt_detail"],
    )

    print("== Selesai ==")
    print(f"  PTN         : {len(ptn_list)}")
    print(f"  Prodi SNBP  : {len(results['snbp_prodi'])}")
    print(f"  Prodi SNBT  : {len(results['snbt_prodi'])}")
    print(f"  Detail SNBP : {len(results['snbp_detail'])}")
    print(f"  Detail SNBT : {len(results['snbt_detail'])}")
    print(f"  Output      : {out_dir}")


if __name__ == "__main__":
    main()
