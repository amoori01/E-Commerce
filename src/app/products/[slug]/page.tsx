'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRODUCTS, getProductUnitPrice, BRANCHES } from '@/lib/constants';
import { useCart } from '@/lib/cart-context';
import {
  FileText,
  ShoppingCart,
  Building2,
  Shield,
  Download,
  CheckCircle2,
  Layers,
  ArrowRight,
  ChevronRight,
  Printer,
  Calendar,
  Truck,
  Award,
  Package,
  Boxes,
  Heart,
  Star,
  Check
} from 'lucide-react';
import { useWishlist } from '@/lib/wishlist-context';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = use(params);
  const product = PRODUCTS.find((p) => p.slug === resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const { addToCart, openRfq } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { INITIAL_REVIEWS } = require('@/lib/constants');
  const [reviews, setReviews] = useState<import('@/types').ProductReview[]>(
    INITIAL_REVIEWS.filter((r: import('@/types').ProductReview) => r.productId === product.id)
  );
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string>(product.imageUrl);
  const [quantity, setQuantity] = useState<number>(product.moq || 1);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewTitle.trim() || !newReviewComment.trim()) return;
    const rev: import('@/types').ProductReview = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      userId: 'e1111111-1111-1111-1111-111111111111',
      userName: 'Alemayehu Tadesse',
      companyName: 'MIDROC Construction Ethiopia',
      rating: newReviewRating,
      title: newReviewTitle,
      comment: newReviewComment,
      isVerifiedBuyer: true,
      astmComplianceVerified: true,
      createdAt: new Date().toISOString(),
    };
    setReviews([rev, ...reviews]);
    setNewReviewTitle('');
    setNewReviewComment('');
    setReviewSuccess('Review successfully submitted and certified with verified buyer badge.');
    setTimeout(() => setReviewSuccess(null), 4000);
  };

  const isStreamA = product.transactionStream === 'direct_checkout';
  const effectiveUnitPrice = getProductUnitPrice(product, quantity);
  const lineItemTotal = effectiveUnitPrice * quantity;
  const baselineTotal = product.unitPriceEtb * quantity;
  const volumeDiscountSavings = Math.max(0, baselineTotal - lineItemTotal);

  // Related products
  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id && p.subsidiaryId === product.subsidiaryId).slice(0, 3);

  const handleDownloadDoc = (type: 'datasheet' | 'cad') => {
    setDownloadNotice(
      type === 'datasheet'
        ? `Official ERCA/ISO specification sheet (${product.sku}) generated for offline procurement review.`
        : `Engineering CAD blueprint (.dwg) for ${product.sku} packaged for architectural BIM modeling.`
    );
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-xs text-slate-800">
      {/* 1. BREADCRUMBS */}
      <nav className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
        <Link href="/" className="hover:text-amg-navy transition-colors">
          AMG Enterprise Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/#${product.subsidiaryCode.toLowerCase()}`} className="hover:text-amg-navy transition-colors">
          {product.subsidiaryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold truncate max-w-[280px]">
          {product.name}
        </span>
      </nav>

      {downloadNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-sm flex items-center space-x-2 font-semibold text-xs shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* 2. MAIN PRODUCT OVERVIEW (Grainger / Alibaba Industrial Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-slate-300 p-6 rounded-sm shadow-crisp">
        {/* Left: Gallery & Technical Diagrams */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-80 bg-slate-100 border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <span
                className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-sm text-white ${
                  isStreamA ? 'bg-amg-navy' : 'bg-amg-red'
                }`}
              >
                {isStreamA ? 'Stream A: Instant Digital Checkout' : 'Stream B: RFQ Custom Quotation'}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-sm">
                SKU: {product.sku}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {product.galleryImages && product.galleryImages.length > 0 && (
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setSelectedImage(product.imageUrl)}
                className={`w-16 h-16 border rounded-sm overflow-hidden ${
                  selectedImage === product.imageUrl ? 'border-amg-navy ring-1 ring-amg-navy' : 'border-slate-200'
                }`}
              >
                <img src={product.imageUrl} alt="Main" className="w-full h-full object-cover" />
              </button>
              {product.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 border rounded-sm overflow-hidden ${
                    selectedImage === img ? 'border-amg-navy ring-1 ring-amg-navy' : 'border-slate-200'
                  }`}
                >
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Downloadable Documents Section */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-sm space-y-2">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
              <Download className="w-3.5 h-3.5 text-amg-navy" />
              <span>Certified Technical Documentation:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleDownloadDoc('datasheet')}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-sm text-[11px] flex items-center justify-center space-x-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-amg-red" />
                <span>Download PDF Datasheet</span>
              </button>
              {product.cadDownloadUrl && (
                <button
                  type="button"
                  onClick={() => handleDownloadDoc('cad')}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-sm text-[11px] flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-amg-navy" />
                  <span>Download CAD (.dwg)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Technical Specifications, Volume Pricing & Action Trigger */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amg-navy uppercase tracking-wider">
              {product.subsidiaryName} • {product.categoryName}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {product.name}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {product.description}
            </p>
          </div>

          {/* STREAM A: PRICING & TIER MATRIX */}
          {isStreamA && (
            <div className="space-y-3">
              {/* Dynamic Volume Pricing Table */}
              {product.volumePricing && product.volumePricing.length > 0 && (
                <div className="border border-slate-300 rounded-sm overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] flex justify-between items-center">
                    <span>Tiered Volume Pricing Brackets</span>
                    <span className="text-emerald-700 font-semibold">Bulk Contractor Discounts</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="py-1.5 px-3">Order Quantity Range</th>
                        <th className="py-1.5 px-3">Unit Price (Excl. VAT)</th>
                        <th className="py-1.5 px-3 text-right">Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {product.volumePricing.map((tier, idx) => {
                        const isCurrentActive =
                          quantity >= tier.minQuantity &&
                          (!tier.maxQuantity || quantity <= tier.maxQuantity);
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isCurrentActive
                                ? 'bg-amg-navy-50 font-bold text-amg-navy'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono">
                              {tier.minQuantity}
                              {tier.maxQuantity ? ` – ${tier.maxQuantity}` : '+'} {product.unitMeasurement}s
                            </td>
                            <td className="py-2 px-3 font-mono font-extrabold text-slate-900">
                              ETB {tier.unitPriceEtb.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {tier.discountPercentage > 0 ? (
                                <span className="text-emerald-600 font-bold">
                                  Save {tier.discountPercentage}%
                                </span>
                              ) : (
                                <span className="text-slate-400">Standard</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quantity Selector & Real-Time Price Calculation Box */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Effective Unit Price
                    </span>
                    <div className="text-xl font-extrabold font-mono text-amg-navy">
                      ETB {effectiveUnitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-500"> / {product.unitMeasurement}</span>
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700 text-xs">Quantity:</span>
                    <div className="flex items-center border border-slate-300 rounded-sm bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                        className="px-3 py-1 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={product.moq || 1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(product.moq || 1, Number(e.target.value)))}
                        className="w-16 text-center font-mono font-bold text-xs py-1 border-x border-slate-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 font-bold text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-slate-500 font-mono text-xs">{product.unitMeasurement}s</span>
                  </div>
                </div>

                {/* Subtotal & Savings Banner */}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-600 font-medium">Line Total (Excl. 15% VAT):</span>
                    {volumeDiscountSavings > 0 && (
                      <span className="block text-[11px] font-bold text-emerald-700">
                        🎉 Volume Tier Applied: Saved ETB {volumeDiscountSavings.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-extrabold text-base text-slate-900">
                    ETB {lineItemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(product, quantity)}
                    className="flex-1 py-3 bg-amg-navy hover:bg-amg-navy-900 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center space-x-2 shadow-panel"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add {quantity} {product.unitMeasurement}s to Cart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className={`px-3 py-3 border rounded-sm transition-colors flex items-center justify-center ${
                      isInWishlist(product.id)
                        ? 'bg-red-50 border-red-300 text-amg-red'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-amg-red' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STREAM B: RFQ PROCURING BOX */}
          {!isStreamA && (
            <div className="bg-amg-red-50/60 border border-amg-red-200 p-5 rounded-sm space-y-3">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-amg-red text-white text-[10px] font-bold uppercase rounded-sm">
                  Agent-Assisted Custom Escalation
                </span>
                <span className="font-mono text-xs text-slate-500">MOQ: {product.moq} {product.unitMeasurement}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Custom Engineering Quotation Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Heavy structural steel frameworks, Sinotruk prime movers, and bulk cryogenic gases require dedicated sales engineers to evaluate project drawings, factory mill slots, and custom volume pricing matrices.
              </p>

              <button
                type="button"
                onClick={() => openRfq(product)}
                className="w-full py-3 bg-amg-red hover:bg-red-800 text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center space-x-2 shadow-panel"
              >
                <FileText className="w-4 h-4" />
                <span>Submit Technical RFQ Specification Request</span>
              </button>
            </div>
          )}

          {/* Branch Availability & Pickup Lead Times */}
          {product.stockSummary && (
            <div className="border border-slate-200 rounded-sm p-4 space-y-2 bg-white">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-amg-navy" />
                  <span>Branch Availability & Fulfillment Speed:</span>
                </span>
                <span className="font-mono text-emerald-700 font-bold">
                  {product.stockSummary.totalOnHand} Total Available
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {product.stockSummary.branches.map((b, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-sm space-y-0.5 font-mono">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{b.branchName}:</span>
                      <span className="text-emerald-700">{b.quantity} {product.unitMeasurement}s</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {b.leadTimeDays === 0 ? '✓ Ready for Same-Day Pickup' : `Dispatch Lead Time: ${b.leadTimeDays} Day`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. GRAINGER-STYLE PARAMETRIC SPECIFICATIONS TABLE */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amg-navy" />
            <h2 className="text-base font-extrabold text-slate-900">
              Parametric Technical Specifications Sheet
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            ES ISO / ASTM International Standard Verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono">
          {Object.entries(product.technicalSpecs).map(([specKey, specVal]) => (
            <div key={specKey} className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-sans font-medium">{specKey}:</span>
              <span className="text-slate-900 font-bold text-right">{specVal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. VERIFIED CUSTOMER REVIEWS & ASTM/ISO LAB COMPLIANCE */}
      <div className="bg-white border border-slate-300 rounded-sm shadow-crisp p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Verified Industrial Buyer Reviews & Quality Certifications
              </h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-sm">
                ASTM / ISO Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Field reports, lab tensile testing feedback, and jobsite performance evaluations from verified procurement contractors.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSubmittingReview(!isSubmittingReview)}
            className="px-3.5 py-1.5 bg-amg-navy text-white text-xs font-bold rounded-sm hover:bg-amg-navy-900 transition-colors shrink-0"
          >
            {isSubmittingReview ? 'Close Review Form' : '+ Submit Project Field Evaluation'}
          </button>
        </div>

        {reviewSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-xs font-semibold">
            {reviewSuccess}
          </div>
        )}

        {isSubmittingReview && (
          <form onSubmit={handleAddReview} className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-3">
            <h3 className="font-bold text-xs text-slate-900">Submit Contractor Quality Evaluation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Evaluation Title / Spec Standard</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tensile Strength & Zinc Adhesion Verification"
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  className="w-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className="w-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none font-bold"
                >
                  <option value={5}>5 Stars - Exceeds ASTM Standards</option>
                  <option value={4}>4 Stars - Meets Technical Tolerance</option>
                  <option value={3}>3 Stars - Acceptable Field Performance</option>
                  <option value={2}>2 Stars - Minor Coating/Tolerance Variance</option>
                  <option value={1}>1 Star - Non-Compliant Batch</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Contractor Notes & Lab Test Observations</label>
              <textarea
                required
                rows={3}
                placeholder="Detail metallurgical results, installation speed, weather resistance, or delivery handling..."
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="w-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs rounded-sm focus:border-amg-navy outline-none font-mono"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-amg-navy text-white text-xs font-bold rounded-sm hover:bg-amg-navy-900 transition-colors"
              >
                Publish Certified Review
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-slate-500 text-xs italic">
              No field reviews logged for this specific consignment yet.
            </p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="border border-slate-200 bg-slate-50/50 p-4 rounded-sm space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{rev.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed font-sans">{rev.comment}</p>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {rev.userName} {rev.companyName ? `• ${rev.companyName}` : ''}
                  </span>
                  {rev.isVerifiedBuyer && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-sm flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Verified Commercial Buyer</span>
                    </span>
                  )}
                  {rev.astmComplianceVerified && (
                    <span className="text-slate-500 font-mono text-[10px]">
                      [Lab Certified Batch]
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. CROSS-SELL / RELATED SUBSIDIARY PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Related Engineering Components & Consumables
            </h2>
            <Link href="/" className="text-amg-navy font-bold hover:underline text-xs flex items-center space-x-1">
              <span>View Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                className="bg-white border border-slate-300 rounded-sm p-4 shadow-crisp hover:shadow-panel transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-36 bg-slate-100 rounded-sm overflow-hidden border border-slate-200">
                    <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">SKU: {rel.sku}</span>
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{rel.name}</h3>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-mono font-bold text-amg-navy">
                    {rel.transactionStream === 'direct_checkout'
                      ? `ETB ${rel.unitPriceEtb.toLocaleString()}`
                      : 'RFQ Quote'}
                  </span>
                  <Link
                    href={`/products/${rel.slug}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-amg-navy hover:text-white border border-slate-300 rounded-sm font-bold text-[11px] transition-colors"
                  >
                    View Specs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
