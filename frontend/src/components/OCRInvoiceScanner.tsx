"use client";

import React, { useState } from 'react';
import { Camera, Upload, CheckCircle, FileText, AlertTriangle } from 'lucide-react';

interface OCRInvoiceScannerProps {
  onScanComplete: (invoiceData: { vendor: string; date: string; totalAmount: number; category: string }) => void;
}

export const OCRInvoiceScanner: React.FC<OCRInvoiceScannerProps> = ({ onScanComplete }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState({
    vendor: '',
    date: '',
    totalAmount: 0,
    category: 'Fertilizers & Agri Input'
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      simulateOCRScan();
    }
  };

  const simulateOCRScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setExtractedData({
        vendor: 'Sri Lakshmi Agri Traders',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 4850.00,
        category: 'Fertilizers & Agri Input'
      });
      setIsScanning(false);
    }, 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">OCR Receipt & Invoice Scanner</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Capture Box */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 bg-slate-50 dark:bg-slate-900/50">
          {selectedImage ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200">
              <img src={selectedImage} alt="Receipt preview" className="w-full h-full object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="text-white text-xs font-semibold flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scanning OCR fields...
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">Upload photo of paper receipt or bill invoice</p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition">
                <Upload className="w-4 h-4" />
                Select Photo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* Verification & Edit Column */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-3 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Extracted Invoice Data
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Vendor / Store Name</label>
                <input
                  type="text"
                  value={extractedData.vendor}
                  onChange={(e) => setExtractedData({ ...extractedData, vendor: e.target.value })}
                  placeholder="e.g. Sri Lakshmi Traders"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Total Amount (Rs)</label>
                  <input
                    type="number"
                    value={extractedData.totalAmount}
                    onChange={(e) => setExtractedData({ ...extractedData, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={extractedData.date}
                    onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            disabled={!extractedData.vendor || extractedData.totalAmount <= 0}
            onClick={() => onScanComplete(extractedData)}
            className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition shadow-md"
          >
            Confirm & Save Invoice Entry
          </button>
        </div>
      </div>
    </div>
  );
};
