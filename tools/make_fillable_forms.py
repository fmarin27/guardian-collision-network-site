import os
import sys
import fitz  # PyMuPDF
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    DictionaryObject,
    NameObject,
    ArrayObject,
    NumberObject,
    BooleanObject,
    TextStringObject,
)

# ---------- helpers ----------
def fitz_to_pdf_rect(page_height, r):
    # fitz: top-left origin, y grows downward
    # pdf: bottom-left origin, y grows upward
    x0, y0, x1, y1 = r.x0, r.y0, r.x1, r.y1
    return [x0, page_height - y1, x1, page_height - y0]

def add_text_field(writer, page_index, rect, name, font_size=10):
    page = writer.pages[page_index]

    # Ensure /Annots exists
    if "/Annots" not in page:
        page[NameObject("/Annots")] = ArrayObject()
    annots = page["/Annots"]

    # Widget annotation for text field
    annot = DictionaryObject()
    annot.update({
        NameObject("/Type"): NameObject("/Annot"),
        NameObject("/Subtype"): NameObject("/Widget"),
        NameObject("/FT"): NameObject("/Tx"),
        NameObject("/T"): TextStringObject(name),
        NameObject("/Rect"): ArrayObject([NumberObject(rect[0]), NumberObject(rect[1]), NumberObject(rect[2]), NumberObject(rect[3])]),
        NameObject("/F"): NumberObject(4),  # print flag
        NameObject("/Ff"): NumberObject(0),
        # No border, no fill — keep it clean
        NameObject("/BS"): DictionaryObject({
            NameObject("/W"): NumberObject(0),
        }),
        NameObject("/Border"): ArrayObject([NumberObject(0), NumberObject(0), NumberObject(0)]),
        # Default appearance (black text)
        NameObject("/DA"): TextStringObject(f"/Helv {font_size} Tf 0 g"),
        NameObject("/Q"): NumberObject(0),  # left align
    })

    annots.append(annot)

    # Add to AcroForm fields list
    root = writer._root_object
    if "/AcroForm" not in root:
        root[NameObject("/AcroForm")] = DictionaryObject()
    acro = root["/AcroForm"]

    if "/Fields" not in acro:
        acro[NameObject("/Fields")] = ArrayObject()
    acro["/Fields"].append(annot)

    # Make viewers generate appearances (so typing shows everywhere)
    acro[NameObject("/NeedAppearances")] = BooleanObject(True)

    # Provide Helvetica in DR so /Helv works
    if "/DR" not in acro:
        acro[NameObject("/DR")] = DictionaryObject()
    if "/Font" not in acro["/DR"]:
        acro["/DR"][NameObject("/Font")] = DictionaryObject()
    if "/Helv" not in acro["/DR"]["/Font"]:
        acro["/DR"]["/Font"][NameObject("/Helv")] = DictionaryObject({
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        })

def underscore_rects_for_page(pdf_path, page_index):
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_index)
    H = page.rect.height

    # Find underscore runs
    rects = page.search_for("_")
    doc.close()

    # Convert + filter:
    # Keep only meaningful underline areas (skip tiny "__" inside paragraph like $__ fees)
    out = []
    for r in rects:
        w = r.x1 - r.x0
        if w < 40:
            continue
        out.append((r, w))
    # sort top-to-bottom then left-to-right
    out.sort(key=lambda t: (t[0].y0, t[0].x0))
    return H, [t[0] for t in out]

def make_fillable_from_page(input_pdf, page_index, output_pdf, field_prefix):
    # Extract single page from the source
    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    writer.add_page(reader.pages[page_index])

    # Detect underscore rectangles using PyMuPDF (on the original)
    H, rects = underscore_rects_for_page(input_pdf, page_index)

    # Special-case: if there is a HUGE underline near bottom (signature line),
    # split into Signature + Date so it looks right and behaves right.
    field_num = 1
    for r in rects:
        pdf_rect = fitz_to_pdf_rect(H, r)

        width = pdf_rect[2] - pdf_rect[0]
        y_mid = (pdf_rect[1] + pdf_rect[3]) / 2

        # Expand slightly so typing sits nicely on the line
        pad_y = 3
        pad_x = 2
        pdf_rect = [pdf_rect[0]-pad_x, pdf_rect[1]-pad_y, pdf_rect[2]+pad_x, pdf_rect[3]+pad_y]

        # Signature-like line: very wide + near bottom area
        if width > 420 and y_mid < 200:
            x0, y0, x1, y1 = pdf_rect
            sig_rect = [x0, y0, x0 + (x1-x0)*0.72, y1]
            date_rect = [x0 + (x1-x0)*0.75, y0, x1, y1]
            add_text_field(writer, 0, sig_rect, f"{field_prefix}_signature", font_size=10)
            add_text_field(writer, 0, date_rect, f"{field_prefix}_date", font_size=10)
            continue

        add_text_field(writer, 0, pdf_rect, f"{field_prefix}_{field_num}", font_size=10)
        field_num += 1

    with open(output_pdf, "wb") as f:
        writer.write(f)

def main():
    if len(sys.argv) < 3:
        print("Usage: python tools/make_fillable_forms.py <input_packet_pdf> <output_dir>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    out_dir = sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)

    outputs = [
        ("UAB-Repair-Authorization-Fillable.pdf", 0, "ra"),
        ("UAB-Direction-to-Pay-Fillable.pdf", 1, "dtp"),
        ("UAB-Authorization-Estimate-Dismantling-Fillable.pdf", 2, "ead"),
        ("UAB-Designated-Representative-Fillable.pdf", 3, "dr"),
    ]

    made_files = []

    for filename, page_index, prefix in outputs:
        out_path = os.path.join(out_dir, filename)
        make_fillable_from_page(input_pdf, page_index, out_path, prefix)
        made_files.append(out_path)
        print("Created:", out_path)

    # Optional: make a fillable packet by combining the 4 single-page fillables
    packet_out = os.path.join(out_dir, "UAB-Forms-Packet-All-4-Fillable.pdf")
    packet_writer = PdfWriter()
    for p in made_files:
        r = PdfReader(p)
        packet_writer.add_page(r.pages[0])

    with open(packet_out, "wb") as f:
        packet_writer.write(f)

    print("Created:", packet_out)

if __name__ == "__main__":
    main()
