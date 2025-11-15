"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { type ProductItem } from "@/app/dashboard/products/features/new";
import { type SaleRow } from "@/app/dashboard/sales/features/columns";

type InvoiceProduct = {
  id: string | number;
  price: number;
  quantity: number;
  product: (ProductItem & { name?: string }) | null;
};

type InvoiceData = SaleRow & {
  products: InvoiceProduct[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  notes?: string | null;
};

type InvoiceResponse = {
  data: InvoiceData;
};

type ProductImageValue = ProductItem["image"] extends (infer U)[]
  ? U
  : Exclude<ProductItem["image"], null | undefined | any[]>;

const getPrimaryImage = (
  image: ProductItem["image"]
): ProductImageValue | null => {
  if (!image) return null;
  if (Array.isArray(image)) {
    return (image[0] ?? null) as ProductImageValue | null;
  }
  return image as ProductImageValue;
};

export default function InvoicePrint() {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const params = useParams<{ id: string }>();
  const id = params?.id;

  useEffect(() => {
    if (!id) {
      return;
    }
    const fetchInvoice = async (): Promise<void> => {
      try {
        const res = await axiosInstance.get<InvoiceResponse>(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/sales/${id}?populate[products][populate][product][populate]=image`
        );
        setInvoice(res.data.data);
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = (): void => {
    window.print();
  };

  if (!invoice)
    return (
      <div className="text-center text-gray-500 dark:text-gray-300">
        Loading...
      </div>
    );

  const invoiceDate = invoice.date ? new Date(invoice.date) : null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeftIcon /> Back to Invoices
        </Button>
        <Button onClick={handlePrint} className="mb-4">
          Print Invoice
        </Button>
      </div>

      <div
        ref={printRef}
        className="bg-white text-black dark:bg-gray-900 dark:text-white p-8 rounded shadow max-w-3xl mx-auto
                   print:block print:p-0 print:shadow-none print:max-w-full print:rounded-none print:bg-white print:text-black"
      >
        <h1 className="text-2xl font-bold mb-4">
          Invoice #{invoice.invoice_number}
        </h1>
        <p>
          <strong>Date:</strong>{" "}
          {invoiceDate ? invoiceDate.toLocaleDateString() : "N/A"}
        </p>
        <p>
          <strong>Customer:</strong> {invoice.customer_name}
        </p>
        <p>
          <strong>Email:</strong> {invoice.customer_email}
        </p>
        <p>
          <strong>Phone:</strong> {invoice.customer_phone}
        </p>

        <hr className="my-4 border-gray-300 dark:border-gray-700" />

        <table className="w-full border border-gray-300 dark:border-gray-700 mb-4">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Product
              </th>
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Price
              </th>
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Quantity
              </th>
              <th className="border border-gray-300 dark:border-gray-700 p-2 text-left">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((item) => {
              const product = item.product;
              const imageAsset = getPrimaryImage(product?.image ?? null);
              const imageUrl =
                imageAsset?.formats?.thumbnail?.url ?? imageAsset?.url ?? null;
              return (
                <tr key={item.id}>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    <div className="flex items-center gap-2">
                      {imageUrl && (
                        <img
                          src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${imageUrl}`}
                          alt={product?.name ?? "Product image"}
                          className="w-10 h-10 object-cover"
                        />
                      )}
                      <span>{product?.name ?? "Unnamed product"}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 p-2">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="text-right">
          <p>
            <strong>Subtotal:</strong> ${invoice.subtotal.toFixed(2)}
          </p>
          <p>
            <strong>Discount:</strong> -${invoice.discount_amount.toFixed(2)}
          </p>
          <p>
            <strong>Tax:</strong> +${invoice.tax_amount.toFixed(2)}
          </p>
          <p className="text-xl font-bold mt-2">
            <strong>Total:</strong> ${invoice.total.toFixed(2)}
          </p>
        </div>

        {invoice.notes && (
          <div className="mt-4">
            <p>
              <strong>Notes:</strong>
            </p>
            <p className="italic">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
