#!/usr/bin/env python3
"""
McDonald's-style ordering kiosk - DESKTOP APP (Python + Tkinter).

This is a self-contained desktop demo. It has no third-party dependencies:
Tkinter ships with Python, and the whole menu is embedded below.

Run the kiosk GUI:
    python desktop/mcdo_kiosk.py

Run the headless self-test (used by CI / the classroom):
    python desktop/mcdo_kiosk.py --selftest

The business rules (VAT, Senior/PWD, loyalty points) intentionally mirror
src/pricing.js so the desktop demo behaves exactly like the web app.
"""

import argparse
import sys

VAT_RATE = 0.12
SENIOR_RATE = 0.20
POINT_BLOCK = 100
POINT_VALUE = 10

# ---------------------------------------------------------------------------
# Menu data (mirrors src/seed-data.js)
# ---------------------------------------------------------------------------
MENU = [
    {"name": "Burger McDo", "category": "Burgers", "price": 59, "icon": "🍔", "desc": "100% beef patty with McDo's sauce"},
    {"name": "Cheeseburger McDo", "category": "Burgers", "price": 75, "icon": "🍔", "desc": "Beef patty topped with melting cheese"},
    {"name": "Double Cheeseburger", "category": "Burgers", "price": 110, "icon": "🍔", "desc": "Two beef patties, two cheeses"},
    {"name": "Big Mac", "category": "Burgers", "price": 178, "icon": "🍔", "desc": "Two patties, special sauce, lettuce, cheese"},
    {"name": "McChicken", "category": "Burgers", "price": 105, "icon": "🍔", "desc": "Crispy chicken patty, lettuce, mayo"},
    {"name": "McCrispy Chicken Fillet", "category": "Burgers", "price": 115, "icon": "🍔", "desc": "Whole-muscle crispy fillet"},
    {"name": "Quarter Pounder with Cheese", "category": "Burgers", "price": 165, "icon": "🍔", "desc": "Quarter-pound beef patty with cheese"},
    {"name": "1-pc Chicken McDo w/ Rice", "category": "Chicken", "price": 95, "icon": "🍗", "desc": "Fried chicken, rice and gravy"},
    {"name": "2-pc Chicken McDo w/ Rice", "category": "Chicken", "price": 165, "icon": "🍗", "desc": "Two pieces, rice and gravy"},
    {"name": "1-pc Spicy Chicken McDo w/ Rice", "category": "Chicken", "price": 99, "icon": "🌶️", "desc": "Spicy fried chicken with rice"},
    {"name": "6-pc Chicken McNuggets", "category": "Chicken", "price": 99, "icon": "🍗", "desc": "Six golden nuggets"},
    {"name": "10-pc Chicken McNuggets", "category": "Chicken", "price": 189, "icon": "🍗", "desc": "Ten nuggets, great for sharing"},
    {"name": "20-pc Chicken McNuggets", "category": "Chicken", "price": 375, "icon": "🍗", "desc": "Twenty nuggets for the barkada"},
    {"name": "6-pc Chicken McShare Box", "category": "Chicken", "price": 515, "icon": "🍗", "desc": "Six pieces for sharing"},
    {"name": "8-pc Chicken McShare Box", "category": "Chicken", "price": 670, "icon": "🍗", "desc": "Eight pieces for sharing"},
    {"name": "McSpaghetti Solo", "category": "McSpaghetti & Rice", "price": 78, "icon": "🍝", "desc": "Sweet-style spaghetti with hotdog"},
    {"name": "McSpaghetti Platter", "category": "McSpaghetti & Rice", "price": 262, "icon": "🍝", "desc": "Family-size spaghetti"},
    {"name": "1-pc Chicken McDo w/ McSpaghetti", "category": "McSpaghetti & Rice", "price": 159, "icon": "🍝", "desc": "Chicken with spaghetti"},
    {"name": "Crispy Chicken Fillet Ala King w/ Rice", "category": "McSpaghetti & Rice", "price": 130, "icon": "🍛", "desc": "Creamy ala king sauce"},
    {"name": "Cheesy Eggdesal", "category": "Breakfast", "price": 55, "icon": "🍳", "desc": "Egg and cheese in a soft bun"},
    {"name": "Sausage McMuffin w/ Egg", "category": "Breakfast", "price": 95, "icon": "🍳", "desc": "Sausage, egg and cheese muffin"},
    {"name": "Egg McMuffin", "category": "Breakfast", "price": 99, "icon": "🍳", "desc": "Egg, cheese and ham muffin"},
    {"name": "2-pc Hotcakes", "category": "Breakfast", "price": 89, "icon": "🥞", "desc": "Hotcakes with butter and syrup"},
    {"name": "Big Breakfast", "category": "Breakfast", "price": 157, "icon": "🍳", "desc": "Egg, sausage, hash browns, muffin"},
    {"name": "McFries Regular", "category": "Fries & Sides", "price": 65, "icon": "🍟", "desc": "World Famous Fries, regular"},
    {"name": "McFries Medium", "category": "Fries & Sides", "price": 85, "icon": "🍟", "desc": "World Famous Fries, medium"},
    {"name": "McFries Large", "category": "Fries & Sides", "price": 105, "icon": "🍟", "desc": "World Famous Fries, large"},
    {"name": "BFF Fries", "category": "Fries & Sides", "price": 155, "icon": "🍟", "desc": "Big Fries for Friends"},
    {"name": "Twister Fries", "category": "Fries & Sides", "price": 89, "icon": "🍟", "desc": "Crispy spiral-cut fries"},
    {"name": "Apple Pie", "category": "Fries & Sides", "price": 45, "icon": "🥧", "desc": "Warm apple pie"},
    {"name": "Vanilla Cone", "category": "Desserts", "price": 25, "icon": "🍦", "desc": "Creamy vanilla soft-serve"},
    {"name": "Hot Fudge Sundae", "category": "Desserts", "price": 55, "icon": "🍨", "desc": "Sundae with hot fudge"},
    {"name": "McFlurry with Oreo", "category": "Desserts", "price": 65, "icon": "🍨", "desc": "Soft-serve with Oreo bits"},
    {"name": "Coke McFloat", "category": "Desserts", "price": 65, "icon": "🥤", "desc": "Coke with vanilla soft-serve"},
    {"name": "Chocolate Shake", "category": "Desserts", "price": 75, "icon": "🥤", "desc": "Thick chocolate shake"},
    {"name": "Coke Regular", "category": "Drinks", "price": 55, "icon": "🥤", "desc": "Ice-cold Coca-Cola"},
    {"name": "Coke Large", "category": "Drinks", "price": 75, "icon": "🥤", "desc": "Ice-cold Coca-Cola, large"},
    {"name": "Sprite Regular", "category": "Drinks", "price": 55, "icon": "🥤", "desc": "Lemon-lime soda"},
    {"name": "Royal Regular", "category": "Drinks", "price": 55, "icon": "🥤", "desc": "Orange soda"},
    {"name": "Coke Zero Regular", "category": "Drinks", "price": 55, "icon": "🥤", "desc": "Sugar-free Coca-Cola"},
    {"name": "Iced Tea", "category": "Drinks", "price": 50, "icon": "🧋", "desc": "Sweetened iced tea"},
    {"name": "Brewed Coffee", "category": "Drinks", "price": 45, "icon": "☕", "desc": "Freshly brewed coffee"},
    {"name": "Orange Juice", "category": "Drinks", "price": 55, "icon": "🧃", "desc": "100% orange juice"},
    {"name": "Burger McDo Happy Meal", "category": "Happy Meal", "price": 148, "icon": "🧸", "desc": "Burger, fries, drink and toy"},
    {"name": "McSpaghetti Happy Meal", "category": "Happy Meal", "price": 168, "icon": "🧸", "desc": "Spaghetti, fries, drink and toy"},
    {"name": "4-pc McNuggets Happy Meal", "category": "Happy Meal", "price": 189, "icon": "🧸", "desc": "Nuggets, fries, drink and toy"},
    {"name": "1-pc Chicken McDo Happy Meal", "category": "Happy Meal", "price": 205, "icon": "🧸", "desc": "Chicken, fries, drink and toy"},
    {"name": "McShare Bundle for 3", "category": "Group Meals", "price": 612, "icon": "🍱", "desc": "Sharing bundle for 3"},
    {"name": "McShare Bundle for 4", "category": "Group Meals", "price": 847, "icon": "🍱", "desc": "Complete sharing bundle for 4"},
]

# Option groups by category (mirrors CATEGORY_OPTIONS in the web app)
OPTIONS = {
    "Burgers": {"Add-ons": [("Extra Cheese", 20), ("Bacon", 35), ("Extra Patty", 45)]},
    "Chicken": {"Add-ons": [("Extra Cheese", 20), ("Bacon", 35), ("Extra Rice", 35)]},
    "Fries & Sides": {"Size": [("Regular", 0), ("Medium", 20), ("Large", 40)]},
    "Drinks": {"Size": [("Regular", 0), ("Medium", 20), ("Large", 40)]},
    "Happy Meal": {"Drink": [("Coke", 0), ("Sprite", 0), ("Royal", 0), ("Iced Tea", 0)]},
}

CATEGORIES = [
    "All", "Burgers", "Chicken", "McSpaghetti & Rice", "Breakfast",
    "Fries & Sides", "Desserts", "Drinks", "Happy Meal", "Group Meals",
]

RED = "#da291c"
YELLOW = "#ffc72c"
INK = "#1c1c1c"


def round2(value):
    return round(float(value) + 1e-9, 2)


def money(value):
    return "₱{:,.2f}".format(float(value))


# ---------------------------------------------------------------------------
# Business logic (pure - this is what the self-test exercises)
# ---------------------------------------------------------------------------
def unit_price(base_price, options):
    return round2(base_price + sum(o.get("delta", 0) for o in options))


def compute_order(lines, available_points=0, redeem_points=0, senior_count=0):
    """lines: [{price, qty, options:[{name, delta}]}]"""
    priced = []
    for line in lines:
        unit = unit_price(line["price"], line.get("options", []))
        qty = max(1, int(line.get("qty", 1)))
        priced.append({**line, "unit": unit, "qty": qty, "line_total": round2(unit * qty)})

    subtotal = round2(sum(l["line_total"] for l in priced))
    net = round2(subtotal / (1 + VAT_RATE))

    vatable = vat = exempt = senior_discount = 0.0
    after = subtotal
    if senior_count > 0:
        exempt = net
        senior_discount = round2(net * SENIOR_RATE)
        after = round2(net - senior_discount)
    else:
        vatable = net
        vat = round2(subtotal - net)

    max_redeem = min(
        (int(available_points) // POINT_BLOCK) * POINT_BLOCK,
        (int(after) // POINT_VALUE) * POINT_BLOCK,
    )
    redeem = max(0, int(redeem_points) - (int(redeem_points) % POINT_BLOCK))
    redeem = min(redeem, max(0, max_redeem))
    points_discount = round2(redeem / POINT_BLOCK * POINT_VALUE)
    total = round2(max(0, after - points_discount))

    return {
        "lines": priced,
        "subtotal": subtotal,
        "vatable_sales": vatable,
        "vat_amount": vat,
        "vat_exempt_sales": exempt,
        "senior_discount": senior_discount,
        "senior_pwd_count": int(senior_count),
        "max_redeemable": max(0, max_redeem),
        "redeem_points": redeem,
        "points_discount": points_discount,
        "total": total,
        "points_earned": int(total),
    }


class Cart:
    def __init__(self):
        self.lines = []

    def add(self, item, options=None, qty=1):
        options = options or []
        key = (item["name"], tuple(sorted(o["name"] for o in options)))
        for line in self.lines:
            if (line["name"], tuple(sorted(o["name"] for o in line["options"]))) == key:
                line["qty"] = min(50, line["qty"] + qty)
                return
        self.lines.append({
            "name": item["name"],
            "price": item["price"],
            "icon": item.get("icon", "🍔"),
            "options": options,
            "qty": qty,
        })

    def set_qty(self, index, qty):
        if 0 <= index < len(self.lines):
            if qty <= 0:
                self.lines.pop(index)
            else:
                self.lines[index]["qty"] = min(50, int(qty))

    def clear(self):
        self.lines = []

    def count(self):
        return sum(line["qty"] for line in self.lines)

    def subtotal(self):
        return round2(sum(unit_price(l["price"], l["options"]) * l["qty"] for l in self.lines))


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------
def run_gui():
    import tkinter as tk
    from tkinter import ttk, messagebox

    cart = Cart()
    points = {"balance": 250}
    orders = []
    counter = {"n": 1000}

    root = tk.Tk()
    root.title("McDonald's Order Kiosk - Desktop (Python)")
    root.geometry("1080x680")
    root.configure(bg="#f4f4f5")
    root.minsize(900, 560)

    style = ttk.Style()
    try:
        style.theme_use("clam")
    except tk.TclError:
        pass
    style.configure("Treeview", rowheight=30, font=("Segoe UI", 10))
    style.configure("TButton", font=("Segoe UI", 10, "bold"), padding=6)

    # Header -----------------------------------------------------------------
    header = tk.Frame(root, bg=RED, height=64)
    header.pack(fill="x")
    tk.Label(header, text="M", bg="white", fg=YELLOW, font=("Segoe UI", 22, "bold"),
             width=3).pack(side="left", padx=(14, 10), pady=10)
    tk.Label(header, text="McDonald's Order Kiosk", bg=RED, fg="white",
             font=("Segoe UI", 16, "bold")).pack(side="left")
    points_label = tk.Label(header, text="", bg=YELLOW, fg="#4a3300",
                            font=("Segoe UI", 11, "bold"), padx=12, pady=6)
    points_label.pack(side="right", padx=14)

    body = tk.Frame(root, bg="#f4f4f5")
    body.pack(fill="both", expand=True, padx=12, pady=12)

    # Left: categories -------------------------------------------------------
    left = tk.Frame(body, bg="#f4f4f5", width=190)
    left.pack(side="left", fill="y", padx=(0, 12))
    tk.Label(left, text="Categories", bg="#f4f4f5", font=("Segoe UI", 11, "bold")).pack(anchor="w")
    category_list = tk.Listbox(left, font=("Segoe UI", 11), activestyle="none",
                               selectbackground=RED, selectforeground="white",
                               highlightthickness=0, bd=0)
    for cat in CATEGORIES:
        category_list.insert("end", cat)
    category_list.selection_set(0)
    category_list.pack(fill="both", expand=True, pady=(6, 0))

    # Center: menu grid ------------------------------------------------------
    center = tk.Frame(body, bg="#f4f4f5")
    center.pack(side="left", fill="both", expand=True)
    tk.Label(center, text="Menu", bg="#f4f4f5", font=("Segoe UI", 11, "bold")).pack(anchor="w")
    canvas = tk.Canvas(center, bg="#f4f4f5", highlightthickness=0)
    scrollbar = ttk.Scrollbar(center, orient="vertical", command=canvas.yview)
    grid_frame = tk.Frame(canvas, bg="#f4f4f5")
    grid_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
    canvas.create_window((0, 0), window=grid_frame, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)
    canvas.pack(side="left", fill="both", expand=True)
    scrollbar.pack(side="right", fill="y")

    # Right: cart ------------------------------------------------------------
    right = tk.Frame(body, bg="white", width=330, highlightbackground="#e2e2e2", highlightthickness=1)
    right.pack(side="right", fill="y")
    tk.Label(right, text="Your Order", bg=RED, fg="white", font=("Segoe UI", 12, "bold"),
             pady=10).pack(fill="x")
    cart_tree = ttk.Treeview(right, columns=("qty", "item", "total"), show="headings", height=12)
    cart_tree.heading("qty", text="Qty")
    cart_tree.heading("item", text="Item")
    cart_tree.heading("total", text="Amount")
    cart_tree.column("qty", width=44, anchor="center")
    cart_tree.column("item", width=186)
    cart_tree.column("total", width=84, anchor="e")
    cart_tree.pack(fill="both", expand=True, padx=10, pady=10)

    totals_label = tk.Label(right, text="", bg="white", justify="left",
                            font=("Consolas", 10), anchor="w")
    totals_label.pack(fill="x", padx=12)

    def refresh_points():
        points_label.config(text=f"🏅 {points['balance']} pts")

    def refresh_cart():
        cart_tree.delete(*cart_tree.get_children())
        for index, line in enumerate(cart.lines):
            label = line["name"] + (" (" + ", ".join(o["name"] for o in line["options"]) + ")" if line["options"] else "")
            cart_tree.insert("", "end", iid=str(index), values=(line["qty"], label,
                                                                money(unit_price(line["price"], line["options"]) * line["qty"])))
        subtotal = cart.subtotal()
        totals_label.config(text=f"Subtotal      {money(subtotal)}\n"
                                 f"VAT (12%) incl.\n"
                                 f"Points earned  {int(subtotal)} pts")
        refresh_points()

    def add_item(item):
        options_by_group = OPTIONS.get(item["category"])
        if not options_by_group:
            cart.add(item)
            refresh_cart()
            return
        # simple option picker dialog
        dialog = tk.Toplevel(root)
        dialog.title(item["name"])
        dialog.configure(bg="white")
        dialog.transient(root)
        dialog.grab_set()
        tk.Label(dialog, text=f"{item['icon']}  {item['name']}", bg="white",
                 font=("Segoe UI", 13, "bold")).pack(padx=18, pady=(16, 4), anchor="w")
        tk.Label(dialog, text=item["desc"], bg="white", fg="#6d6d6d",
                 font=("Segoe UI", 10)).pack(padx=18, anchor="w")

        selections = []
        for group, choices in options_by_group.items():
            tk.Label(dialog, text=group, bg="white", font=("Segoe UI", 10, "bold")).pack(padx=18, pady=(12, 0), anchor="w")
            frame = tk.Frame(dialog, bg="white")
            frame.pack(padx=18, anchor="w")
            group_vars = []
            for name, delta in choices:
                var = tk.BooleanVar(value=(name in ("Regular", "Coke", "Extra Cheese")))
                tk.Checkbutton(frame, text=f"{name} (+{money(delta)})", variable=var, bg="white").pack(side="left")
                group_vars.append((name, delta, var))
            selections.append(group_vars)

        price_label = tk.Label(dialog, text="", bg="white", fg=RED, font=("Segoe UI", 12, "bold"))
        price_label.pack(padx=18, pady=12, anchor="w")

        def current_options():
            chosen = []
            for group_vars in selections:
                for name, delta, var in group_vars:
                    if var.get():
                        chosen.append({"name": name, "delta": delta})
            return chosen

        def update_price(*_):
            price_label.config(text="Total: " + money(unit_price(item["price"], current_options())))

        for group_vars in selections:
            for _, _, var in group_vars:
                var.trace_add("write", update_price)
        update_price()

        def confirm():
            cart.add(item, current_options())
            dialog.destroy()
            refresh_cart()

        ttk.Button(dialog, text="Add to Order", command=confirm).pack(padx=18, pady=(0, 16), fill="x")

    def render_menu(*_):
        for child in grid_frame.winfo_children():
            child.destroy()
        category = category_list.get(category_list.curselection()[0]) if category_list.curselection() else "All"
        shown = [m for m in MENU if category == "All" or m["category"] == category]
        columns = 3
        for i, item in enumerate(shown):
            card = tk.Frame(grid_frame, bg="white", highlightbackground="#e2e2e2", highlightthickness=1)
            card.grid(row=i // columns, column=i % columns, padx=6, pady=6, sticky="nsew")
            tk.Label(card, text=item["icon"], bg="white", font=("Segoe UI", 26)).pack(pady=(10, 2))
            tk.Label(card, text=item["name"], bg="white", font=("Segoe UI", 10, "bold"),
                     wraplength=170, justify="center").pack(padx=8)
            tk.Label(card, text=money(item["price"]), bg="white", fg=RED,
                     font=("Segoe UI", 11, "bold")).pack(pady=(2, 6))
            ttk.Button(card, text="+ Add", command=lambda it=item: add_item(it)).pack(pady=(0, 10), padx=10, fill="x")
        for c in range(columns):
            grid_frame.columnconfigure(c, weight=1)

    def change_qty(delta):
        selected = cart_tree.selection()
        if not selected:
            messagebox.showinfo("Select an item", "Select a cart line first, then use +/-.")
            return
        index = int(selected[0])
        cart.set_qty(index, cart.lines[index]["qty"] + delta)
        refresh_cart()

    def checkout():
        if cart.count() == 0:
            messagebox.showinfo("Empty cart", "Add something delicious first!")
            return
        dialog = tk.Toplevel(root)
        dialog.title("Checkout")
        dialog.configure(bg="white")
        dialog.transient(root)
        dialog.grab_set()

        tk.Label(dialog, text="Checkout", bg="white", font=("Segoe UI", 15, "bold")).pack(padx=20, pady=(16, 8), anchor="w")

        order_type = tk.StringVar(value="dine-in")
        tk.Label(dialog, text="Order type", bg="white", font=("Segoe UI", 10, "bold")).pack(padx=20, anchor="w")
        tk.Radiobutton(dialog, text="Dine-in", variable=order_type, value="dine-in", bg="white").pack(padx=20, anchor="w")
        tk.Radiobutton(dialog, text="Take-out", variable=order_type, value="takeout", bg="white").pack(padx=20, anchor="w")

        senior = tk.IntVar(value=0)
        tk.Checkbutton(dialog, text="Senior / PWD discount (VAT-exempt + 20%)", variable=senior, bg="white").pack(padx=20, pady=(8, 0), anchor="w")

        tk.Label(dialog, text="Redeem points (100 pts = ₱10)", bg="white", font=("Segoe UI", 10, "bold")).pack(padx=20, pady=(10, 0), anchor="w")
        redeem = tk.IntVar(value=0)
        spin = tk.Spinbox(dialog, from_=0, to=points["balance"], increment=100, textvariable=redeem, width=8)
        spin.pack(padx=20, anchor="w")

        payment = tk.StringVar(value="card")
        tk.Label(dialog, text="Payment method", bg="white", font=("Segoe UI", 10, "bold")).pack(padx=20, pady=(10, 0), anchor="w")
        payment_frame = tk.Frame(dialog, bg="white")
        payment_frame.pack(padx=20, anchor="w")
        for value, label in (("card", "Card"), ("gcash", "GCash"), ("cash", "Cash")):
            tk.Radiobutton(payment_frame, text=label, variable=payment, value=value, bg="white").pack(side="left")

        summary = tk.Label(dialog, text="", bg="white", justify="left", font=("Consolas", 10), anchor="w")
        summary.pack(padx=20, pady=12, fill="x")

        def totals_now():
            return compute_order(cart.lines, points["balance"], redeem.get(), 1 if senior.get() else 0)

        def update_summary(*_):
            t = totals_now()
            summary.config(text=(
                f"Subtotal        {money(t['subtotal'])}\n"
                f"Senior/PWD      -{money(t['senior_discount'])}\n"
                f"Points discount -{money(t['points_discount'])}\n"
                f"VAT (12%)        {money(t['vat_amount'])}\n"
                f"TOTAL           {money(t['total'])}\n"
                f"Points earned   +{t['points_earned']}"
            ))

        senior.trace_add("write", update_summary)
        redeem.trace_add("write", update_summary)
        update_summary()

        def place():
            t = totals_now()
            counter["n"] += 1
            code = "MC-{}".format(counter["n"])
            points["balance"] = points["balance"] - t["redeem_points"] + t["points_earned"]
            order = {
                "code": code,
                "items": list(cart.lines),
                "totals": t,
                "order_type": order_type.get(),
                "payment": payment.get(),
                "status": "received",
            }
            orders.append(order)
            cart.clear()
            refresh_cart()
            dialog.destroy()
            show_receipt(order, points["balance"])

        ttk.Button(dialog, text="Pay & Place Order", command=place).pack(padx=20, pady=(0, 18), fill="x")

    def show_receipt(order, balance_after):
        t = order["totals"]
        window = tk.Toplevel(root)
        window.title("Receipt " + order["code"])
        window.configure(bg="white")
        lines = [
            "        MCDONALD'S",
            "   McDo Self-Order Kiosk",
            "   Store #2026 - Manila",
            "   VAT REG TIN 000-123-456",
            "-" * 40,
            "Order : " + order["code"],
            "Type  : " + order["order_type"],
            "Pay   : " + order["payment"],
            "-" * 40,
        ]
        for line in order["items"]:
            name = line["name"] + (" [" + ", ".join(o["name"] for o in line["options"]) + "]" if line["options"] else "")
            lines.append("{} x {}".format(line["qty"], name))
            lines.append("{:>40}".format(money(unit_price(line["price"], line["options"]) * line["qty"])))
        lines += [
            "-" * 40,
            "{:<22}{:>18}".format("Subtotal", money(t["subtotal"])),
            "{:<22}{:>18}".format("Senior/PWD", "-" + money(t["senior_discount"])),
            "{:<22}{:>18}".format("Points discount", "-" + money(t["points_discount"])),
            "{:<22}{:>18}".format("VAT (12%)", money(t["vat_amount"])),
            "{:<22}{:>18}".format("TOTAL", money(t["total"])),
            "-" * 40,
            "{:<22}{:>18}".format("Points earned", "+{}".format(t["points_earned"])),
            "{:<22}{:>18}".format("Points balance", str(balance_after)),
            "",
            "Thank you for dining with us!",
        ]
        tk.Label(window, text="\n".join(lines), bg="white", font=("Consolas", 10),
                 justify="left").pack(padx=22, pady=18)

    # Bottom bar buttons -----------------------------------------------------
    bar = tk.Frame(right, bg="white")
    bar.pack(fill="x", padx=10, pady=(0, 12))
    ttk.Button(bar, text="− ", command=lambda: change_qty(-1)).pack(side="left", expand=True, fill="x")
    ttk.Button(bar, text="+ ", command=lambda: change_qty(1)).pack(side="left", expand=True, fill="x")
    ttk.Button(bar, text="Clear", command=lambda: (cart.clear(), refresh_cart())).pack(side="left", expand=True, fill="x")
    ttk.Button(right, text="Checkout", command=checkout).pack(fill="x", padx=10, pady=(0, 12))

    category_list.bind("<<ListboxSelect>>", render_menu)

    render_menu()
    refresh_cart()
    root.mainloop()


# ---------------------------------------------------------------------------
# Self-test (headless, no GUI, no display needed)
# ---------------------------------------------------------------------------
def selftest():
    failures = []

    def check(label, actual, expected):
        if actual != expected:
            failures.append(f"{label}: expected {expected}, got {actual}")
            print(f"FAIL  {label} (expected {expected}, got {actual})")
        else:
            print(f"ok    {label}")

    check("unit price adds deltas", unit_price(100, [{"delta": 20}, {"delta": 35}]), 155)
    t = compute_order([{"price": 112, "qty": 1, "options": []}])
    check("vatable sales", t["vatable_sales"], 100.0)
    check("vat amount", t["vat_amount"], 12.0)
    check("total equals subtotal", t["total"], 112.0)

    t = compute_order([{"price": 178, "qty": 1, "options": [{"delta": 20}, {"delta": 35}]}])
    check("subtotal with options", t["subtotal"], 233.0)

    t = compute_order([{"price": 233, "qty": 1, "options": []}], senior_count=1)
    check("senior discount", t["senior_discount"], 41.61)
    check("senior total", t["total"], 166.43)
    check("senior vat exempt", t["vat_amount"], 0.0)

    t = compute_order([{"price": 250, "qty": 1, "options": []}], available_points=500, redeem_points=150)
    check("redeem rounds to a block", t["redeem_points"], 100)
    check("points discount", t["points_discount"], 10.0)
    check("total after points", t["total"], 240.0)

    t = compute_order([{"price": 500, "qty": 1, "options": []}], available_points=50, redeem_points=100)
    check("cannot redeem more than owned", t["redeem_points"], 0)

    cart = Cart()
    big_mac = next(m for m in MENU if m["name"] == "Big Mac")
    cart.add(big_mac, [{"name": "Extra Cheese", "delta": 20}, {"name": "Bacon", "delta": 35}], 2)
    cart.add(big_mac, [{"name": "Extra Cheese", "delta": 20}, {"name": "Bacon", "delta": 35}], 1)
    check("identical lines merge", len(cart.lines), 1)
    check("merged quantity", cart.count(), 3)
    check("cart subtotal", cart.subtotal(), 699.0)

    check("menu size", len(MENU), 49)
    check("categories", len(CATEGORIES) - 1, 9)

    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED")
        return 1
    print("All checks passed.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="McDonald's kiosk - desktop app")
    parser.add_argument("--selftest", action="store_true", help="run headless logic checks")
    args = parser.parse_args()

    if args.selftest:
        sys.exit(selftest())

    try:
        run_gui()
    except ImportError:
        print("Tkinter is not available in this Python installation.")
        print("Run the logic checks instead:  python desktop/mcdo_kiosk.py --selftest")
        sys.exit(1)


if __name__ == "__main__":
    main()
