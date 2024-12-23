import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export type RiskAssessmentData = {
  department: string;
  risk: string;
  valueChainStep: string;
  probability: number;
  frequency: number;
  severity: number;
  riskScore: number;
  financialImpact: string;
  date: string;
};

interface RiskAssessmentProps {
  onCalculate: (riskScore: number) => void;
  selectedDepartment: string | null;
  selectedRisk: string | null;
  selectedStep: string | null;
}

const getFinancialImpact = (riskScore: number): string => {
  if (riskScore > 400) return ">20M Dolar";
  if (riskScore > 200) return "20 - 10M Dolar";
  if (riskScore > 70) return "10 - 5M Dolar";
  if (riskScore > 20) return "5 - 1M Dolar";
  return "1 - 0M Dolar";
};

const getProbabilityDescription = (value: number): string => {
  if (value === 10) return "Beklenir, kesin";
  if (value === 8) return "Yüksek/oldukça mümkün";
  if (value === 6) return "Olası";
  if (value === 3) return "Mümkün, fakat düşük";
  if (value === 1) return "Beklenmez fakat mümkün";
  if (value === 0.1) return "Beklenmez";
  return "";
};

const getFrequencyDescription = (value: number): string => {
  if (value === 10) return "Hemen hemen sürekli (Hergün)";
  if (value === 8) return "Sık (Ayda bir veya birkaç defa)";
  if (value === 6) return "Ara sıra (6 ayda 1)";
  if (value === 3) return "Sık değil (Yılda birkaç defa)";
  if (value === 1) return "Seyrek (3 yılda 1)";
  if (value === 0.1) return "Çok seyrek (>3 yıl)";
  return "";
};

export const RiskAssessment = ({ 
  onCalculate, 
  selectedDepartment,
  selectedRisk,
  selectedStep 
}: RiskAssessmentProps) => {
  const [probability, setProbability] = useState("");
  const [frequency, setFrequency] = useState("");
  const [severity, setSeverity] = useState("");
  const [savedAssessments, setSavedAssessments] = useState<RiskAssessmentData[]>([]);

  const handleCalculate = () => {
    const p = Number(probability);
    const f = Number(frequency);
    const s = Number(severity);

    if (!selectedDepartment || !selectedRisk || !selectedStep) {
      toast.error("Lütfen departman, risk ve değer zinciri adımı seçin");
      return;
    }

    if (!p || !f || !s) {
      toast.error("Lütfen tüm değerleri girin");
      return;
    }

    const riskScore = p * f * s;
    const financialImpact = getFinancialImpact(riskScore);
    onCalculate(riskScore);

    const newAssessment: RiskAssessmentData = {
      department: selectedDepartment,
      risk: selectedRisk,
      valueChainStep: selectedStep,
      probability: p,
      frequency: f,
      severity: s,
      riskScore,
      financialImpact,
      date: new Date().toISOString(),
    };

    setSavedAssessments([...savedAssessments, newAssessment]);
    toast.success("Risk değerlendirmesi kaydedildi");
  };

  const handleDelete = (index: number) => {
    const newAssessments = savedAssessments.filter((_, i) => i !== index);
    setSavedAssessments(newAssessments);
    toast.success("Risk değerlendirmesi silindi");
  };

  const handleExport = () => {
    if (savedAssessments.length === 0) {
      toast.error("Dışa aktarılacak değerlendirme bulunamadı");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(savedAssessments);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Risk Değerlendirmeleri");
    XLSX.writeFile(wb, "risk_degerlendirmeleri.xlsx");
    toast.success("Değerlendirmeler Excel dosyası olarak indirildi");
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Risk Değerlendirmesi</h2>
      
      <div className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="probability">Olasılık (0.1-10)</Label>
          <Input
            id="probability"
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
          />
          {probability && (
            <p className="text-sm text-gray-600 mt-1">
              {getProbabilityDescription(Number(probability))}
            </p>
          )}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="frequency">Frekans (0.1-10)</Label>
          <Input
            id="frequency"
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          />
          {frequency && (
            <p className="text-sm text-gray-600 mt-1">
              {getFrequencyDescription(Number(frequency))}
            </p>
          )}
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="severity">Şiddet (0.1-100)</Label>
          <Input
            id="severity"
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCalculate} className="flex-1">
            Hesapla ve Kaydet
          </Button>
          <Button onClick={handleExport} variant="outline">
            Excel'e Aktar
          </Button>
        </div>
      </div>

      {savedAssessments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Kaydedilen Değerlendirmeler</h3>
          <div className="space-y-4">
            {savedAssessments.map((assessment, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{assessment.risk}</p>
                  <p className="text-sm text-gray-600">
                    {assessment.department} - {assessment.valueChainStep}
                  </p>
                  <p className="text-sm text-gray-600">
                    Risk Skoru: {assessment.riskScore.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Finansal Etki: {assessment.financialImpact}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(index)}
                >
                  Sil
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};