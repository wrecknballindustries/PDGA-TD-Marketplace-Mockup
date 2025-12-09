<?php
// AI was used to assist writing

// checkout.php
// Handles checkout form submission and emails a simple text receipt.

// Only accept POST requests.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    die("Invalid request");
}

// Gather customer fields from the checkout form.
$name    = trim($_POST["fullname"] ?? "");
$email   = trim($_POST["email"] ?? "");
$address = trim($_POST["address"] ?? "");
$city    = trim($_POST["city"] ?? "");
$state   = trim($_POST["state"] ?? "");
$zip     = trim($_POST["zip"] ?? "");

// Cart payload is posted as JSON from the hidden field.
$cartJson = $_POST["cartPayload"] ?? "[]";
$cart     = json_decode($cartJson, true);
if (!is_array($cart)) {
    $cart = [];
}

// Build a plain-text receipt.
$receipt  = "Order receipt for " . ($name !== "" ? $name : "Customer") . "\n\n";
$receipt .= "Ship to:\n";
if ($name !== "") {
    $receipt .= $name . "\n";
}
if ($address !== "") {
    $receipt .= $address . "\n";
}
if ($city !== "" || $state !== "" || $zip !== "") {
    $receipt .= trim($city . ", " . $state . " " . $zip) . "\n";
}
$receipt .= "\nItems:\n";

// Accumulate line items and totals.
$subtotal = 0.0;
foreach ($cart as $item) {
    if (!is_array($item)) {
        continue;
    }
    $itemName  = isset($item["name"]) ? $item["name"] : "Item";
    $qty       = isset($item["qty"]) ? (int)$item["qty"] : 0;
    $unitPrice = isset($item["price"]) ? (float)$item["price"] : 0.0;

    if ($qty <= 0) {
        continue;
    }

    $lineTotal = $qty * $unitPrice;
    $subtotal += $lineTotal;

    $receipt .= $itemName . " x " . $qty . " — $" . number_format($lineTotal, 2) . "\n";
}

// Tax and shipping match the front-end calculation (7% tax, flat $9.99 shipping if any items).
$taxRate  = 0.07;
$shipping = $subtotal > 0 ? 9.99 : 0.0;
$tax      = $subtotal * $taxRate;
$grand    = $subtotal + $tax + $shipping;

$receipt .= "\n";
$receipt .= "Subtotal: $" . number_format($subtotal, 2) . "\n";
$receipt .= "Tax (7%): $" . number_format($tax, 2) . "\n";
$receipt .= "Shipping: $" . number_format($shipping, 2) . "\n";
$receipt .= "Total: $" . number_format($grand, 2) . "\n";

// Email the receipt if the email address looks valid.
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $to      = $email;
    $subject = "Your Order Receipt";
    $headers = "From: no-reply@yourdomain.com";
    @mail($to, $subject, $receipt, $headers);
}

// Render a simple confirmation page and echo the same receipt.
echo "<h2>Order received!</h2>";
echo "<pre>" . htmlspecialchars($receipt, ENT_QUOTES, "UTF-8") . "</pre>";
?>
