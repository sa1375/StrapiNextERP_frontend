"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { IconLoader2 } from "@tabler/icons-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import Image from "next/image";

type Identifier = number | string;

interface POSCategory {
  id: Identifier;
  name: string;
  documentId?: string;
}

interface POSImage {
  url?: string;
}

interface POSProduct {
  id: Identifier;
  name: string;
  price: number;
  image?: POSImage[] | null;
}

interface CartItem extends POSProduct {
  quantity: number;
}

interface ApiResponse<T> {
  data: T;
}

interface SaleProductPayload {
  product: Identifier;
  quantity: number;
  price: number;
}

interface SalePayload {
  customer_name: string;
  invoice_number: string;
  date: Date;
  notes: string;
  products: SaleProductPayload[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
}

const DEFAULT_CUSTOMER = "POS Customer";

export default function POS() {
  const { status } = useSession();
  const [cartVisible, setCartVisible] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Identifier | null>(
    null
  );
  const [search, setSearch] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(5);
  const [taxRate, setTaxRate] = useState<number>(0.1);
  const [categories, setCategories] = useState<POSCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const fetchCategories = async (): Promise<void> => {
    setLoadingCategories(true);
    try {
      const res = await axiosInstance.get<ApiResponse<POSCategory[]>>(
        "/api/categories"
      );

      setCategories(res.data.data ?? []);
    } catch (error) {
      console.log("Failed to fetch categories", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async (): Promise<void> => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();

      params.append("populate[0]", "image");

      if (debouncedSearch) {
        params.append("filters[name][$containsi]", debouncedSearch);
      }

      if (selectedCategory !== null) {
        params.append(
          "filters[category][id][$eqi]",
          selectedCategory.toString()
        );
      }

      const res = await axiosInstance.get<ApiResponse<POSProduct[]>>(
        `/api/products?${params.toString()}`
      );

      setProducts(res.data.data ?? []);
    } catch (error) {
      console.log("Failed to fetch products", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProducts();
    }
  }, [debouncedSearch, selectedCategory, status]);

  const addToCart = (product: POSProduct): void => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: Identifier): void => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: Identifier, qty: number): void => {
    if (qty < 1) {
      return removeFromCart(id);
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cart]
  );
  const tax = useMemo(
    () => (subtotal - discount) * taxRate,
    [discount, subtotal, taxRate]
  );
  const total = useMemo(
    () => subtotal - discount + tax,
    [discount, subtotal, tax]
  );

  if (status === "loading")
    return (
      <IconLoader2 className="size-10 animate-spin mx-auto h-screen text-gray-500" />
    );

  if (status === "unauthenticated") {
    redirect("/login");
  }

  async function handleSave(): Promise<void> {
    if (cart.length === 0) {
      toast.error("At least one product is required.");
      return;
    }

    setSaving(true);
    try {
      const invoiceNumber = `POS-${Date.now()}`;

      const salePayload: SalePayload = {
        customer_name: DEFAULT_CUSTOMER,
        invoice_number: invoiceNumber,
        date: new Date(),
        notes: DEFAULT_CUSTOMER,
        products: cart.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: Math.round(subtotal),
        discount_amount: Math.round(discount),
        tax_amount: Math.round(tax),
        total: Math.round(total),
      };

      const saleResponse = await axiosInstance.post(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/sale-transactions`,
        {
          data: salePayload,
        }
      );

      if (!saleResponse.data.data?.id) {
        throw new Error("Failed to create sale.");
      }

      setCart([]);
      toast.success("Invoice and stock updated successfully!");
    } catch (error: unknown) {
      console.error("Transaction failed:", error);
      if (error instanceof Error) {
        toast.error(`Transaction failed: ${error.message}`);
      } else {
        toast.error("Transaction failed: An unexpected error occurred.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen relative bg-background text-foreground">
      {/* Cart Toggle Button for small screens */}
      <Button
        onClick={() => setCartVisible(true)}
        className="md:hidden fixed bottom-4 right-4 z-50"
      >
        View Cart
      </Button>

      {/* Main Content */}
      <div className="flex-1 p-4 pt-0 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background z-20 pb-2 mb-2 pt-2">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">Point of Sale</h1>
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button size="icon" variant="ghost">
                  <X className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 w-full"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto sticky top-[6.5rem] bg-background py-2 z-10">
          {loadingCategories ? (
            <div className="flex items-center gap-2 mt-10 w-full">
              <IconLoader2 className="size-5 animate-spin text-gray-500" />
              <p>Loading categories...</p>
            </div>
          ) : (
            [{ id: null, name: "All" } as const, ...categories].map((cat) => (
              <Button
                key={cat.id ?? "all"}
                variant={cat.id === selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id ?? null)}
                className="whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))
          )}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
          {loadingProducts ? (
            <div className="flex items-center gap-2 mt-10 w-full">
              <IconLoader2 className="size-5 animate-spin text-gray-500" />
              <p>Loading products...</p>
            </div>
          ) : (
            products.map((product) => {
              const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";
              const productImageUrl = product.image?.[0]?.url
                ? `${baseUrl}${product.image[0].url}`
                : "/product.jpg";
              return (
                <Card
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full cursor-pointer overflow-hidden rounded-lg border border-primary shadow-sm p-0 hover:opacity-80"
                >
                  <Image
                    src={productImageUrl}
                    alt="Product Image"
                    width={600}
                    height={400}
                    className="h-48 w-full object-cover"
                    style={{ aspectRatio: "600/400", objectFit: "cover" }}
                  />
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">
                        {product.name}
                      </h3>
                      <span className="text-2xl font-bold text-primary">
                        ${product.price}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div
        className={`
          fixed md:static top-0 right-0 h-full w-80 bg-muted border-l p-4 overflow-auto z-40
          ${cartVisible ? "block" : "hidden"} md:block
        `}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cart</h2>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setCartVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {cart.length === 0 && (
          <p className="text-muted-foreground">Cart is empty</p>
        )}

        {cart.map((item) => (
          <div key={item.id} className="py-2 border-b">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)} x {item.quantity}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span className="px-1">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-right mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromCart(item.id)}
                className="text-red-600"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

        {cart.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Discount:</span>
              <span>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Number.parseFloat(e.target.value) || 0)
                  }
                  className="w-20 text-right h-7 px-1"
                />
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Tax (%):</span>
              <span>
                <Input
                  type="number"
                  value={taxRate * 100}
                  onChange={(e) =>
                    setTaxRate((Number.parseFloat(e.target.value) || 0) / 100)
                  }
                  className="w-20 text-right h-7 px-1"
                />
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button className="w-full mt-4" onClick={handleSave}>
              {saving ? "Saving..." : "Checkout"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
