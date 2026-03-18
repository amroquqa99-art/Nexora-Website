import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { FileText, Check } from "lucide-react";

interface Props { contract: any; userId: string; onSigned: () => void; }

const ContractSigning = ({ contract, userId, onSigned }: Props) => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [showCanvas, setShowCanvas] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    return { x, y };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = "hsl(25, 95%, 53%)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, 500, 150); };

  const handleSign = async () => {
    if (!signedName.trim()) { toast({ title: lang === "ar" ? "أدخل اسمك" : "Enter your name", variant: "destructive" }); return; }
    const signatureData = canvasRef.current?.toDataURL("image/png") || "";
    const { error } = await supabase.from("contracts").update({
      status: "signed", signature_data: signatureData, signed_at: new Date().toISOString(), signed_by_name: signedName,
    }).eq("id", contract.id).eq("client_id", userId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: lang === "ar" ? "✓ تم توقيع العقد" : "✓ Contract signed" }); onSigned();
  };

  const isSigned = contract.status === "signed";

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">{contract.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isSigned ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>
          {isSigned ? (lang === "ar" ? "موقّع" : "Signed") : (lang === "ar" ? "في انتظار التوقيع" : "Awaiting Signature")}
        </span>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 mb-4 text-sm text-foreground/80 whitespace-pre-wrap max-h-64 overflow-y-auto">{contract.content}</div>
      {isSigned ? (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg">
          <Check className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm text-green-400 font-medium">{lang === "ar" ? "تم التوقيع بواسطة" : "Signed by"}: {contract.signed_by_name}</p>
            <p className="text-xs text-muted-foreground">{new Date(contract.signed_at).toLocaleString()}</p>
          </div>
          {contract.signature_data && <img src={contract.signature_data} alt="signature" className="h-12 ml-auto" />}
        </div>
      ) : !showCanvas ? (
        <button onClick={() => setShowCanvas(true)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          {lang === "ar" ? "وقّع العقد" : "Sign Contract"}
        </button>
      ) : (
        <div className="space-y-4">
          <input value={signedName} onChange={e => setSignedName(e.target.value)} placeholder={lang === "ar" ? "اكتب اسمك الكامل" : "Type your full name"}
            className="w-full px-4 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
          <div className="border border-border/30 rounded-lg overflow-hidden">
            <p className="text-xs text-muted-foreground p-2 bg-muted/50">{lang === "ar" ? "ارسم توقيعك أدناه" : "Draw your signature below"}</p>
            <canvas ref={canvasRef} width={500} height={150} className="w-full bg-background cursor-crosshair touch-none"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSign} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">{lang === "ar" ? "تأكيد التوقيع" : "Confirm Signature"}</button>
            <button onClick={clearCanvas} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm">{lang === "ar" ? "مسح" : "Clear"}</button>
            <button onClick={() => setShowCanvas(false)} className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm">{lang === "ar" ? "إلغاء" : "Cancel"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSigning;
