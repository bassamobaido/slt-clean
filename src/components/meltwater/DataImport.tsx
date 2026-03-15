import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataImportProps {
  onImport: (tweets: any[]) => void;
}

const safeNum = (v: any): number => {
  if (v == null || v === '' || v === 'NaN') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export const DataImport = ({ onImport }: DataImportProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setMessage('جاري قراءة الملف...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        setStatus('error');
        setMessage('الملف فارغ أو لا يحتوي على بيانات صالحة');
        return;
      }

      // Map Meltwater columns → internal format
      const tweets = rows.map((row, index) => {
        const text = row['text'] || row['Text'] || row['النص'] || row['Opening Text'] || row['tweet'] || row['content'] || '';
        const authorName = row['Author Name'] || row['الكاتب'] || row['author'] || row['Author'] || '';
        const authorHandle = row['Author Handle'] || row['Handle'] || '';
        const url = row['URL'] || row['url'] || row['الرابط'] || '';
        const date = row['Date'] || row['date'] || row['التاريخ'] || '';
        const time = row['Time'] || row['time'] || '';
        const meltwaterKeywords = row['Keywords'] || row['keywords'] || '';
        const contentType = row['Content Type'] || row['content_type'] || '';
        const sourceName = row['Source Name'] || row['source'] || row['المصدر'] || '';
        const hashtags = row['Hashtags'] || row['hashtags'] || '';
        const language = row['Language'] || row['language'] || '';
        const reach = safeNum(row['Reach'] || row['reach'] || row['الوصول'] || row['impressions']);
        const totalEngagement = safeNum(row['Engagement'] || row['engagement']);
        const likes = safeNum(row['Likes'] || row['likes'] || row['إعجابات']);
        const replies = safeNum(row['Replies'] || row['replies'] || row['ردود']);
        const reposts = safeNum(row['Reposts'] || row['reposts'] || row['Retweets'] || row['retweets'] || row['إعادات تغريد']);
        const comments = safeNum(row['Comments'] || row['comments']);
        const views = safeNum(row['Views'] || row['views']);
        const brandSentiment = row['Brand Sentiment'] || row['sentiment'] || row['Sentiment'] || row['المشاعر'] || '';

        // Author display: prefer handle if available
        const author = authorHandle
          ? (authorHandle.startsWith('@') ? authorHandle : `@${authorHandle}`)
          : (authorName || `@user_${index}`);

        return {
          id: index + 1,
          text: String(text).trim(),
          author: String(author),
          authorHandle: String(authorHandle),
          authorName: String(authorName),
          url: String(url),
          date: String(date),
          time: String(time),
          meltwaterKeywords: String(meltwaterKeywords),
          contentType: String(contentType),
          sourceName: String(sourceName),
          hashtags: String(hashtags),
          language: String(language),
          reach,
          totalEngagement,
          views,
          comments,
          reposts,
          // Sentiment defaults — AI will fill these
          sentiment: brandSentiment && brandSentiment !== 'unknown' ? String(brandSentiment) : 'محايد',
          emotion: 'محايد',
          keywords: [] as string[],
          topics: [] as string[],
          // Backward-compatible engagement object
          engagement: { likes, retweets: reposts, replies },
        };
      }).filter(t => t.text.length > 0);

      if (tweets.length === 0) {
        setStatus('error');
        setMessage('لم يتم العثور على منشورات صالحة. تأكد من وجود عمود "text" أو "النص"');
        return;
      }

      setImportedCount(tweets.length);
      setStatus('success');
      setMessage(`تم استيراد ${tweets.length} منشور بنجاح!`);
      onImport(tweets);
    } catch (err) {
      setStatus('error');
      setMessage('خطأ في قراءة الملف. تأكد من أنه ملف Excel أو CSV صالح.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="border border-border bg-gradient-to-br from-sky-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-800">
          <Upload className="h-5 w-5" />
          استيراد بيانات Meltwater
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-sky-700">
          استورد ملف Excel من Meltwater. سيتم تحليل المشاعر والمواضيع تلقائياً بالذكاء الاصطناعي.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="hidden"
          id="data-import"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'loading'}
            className="gap-2 bg-sky-700 hover:bg-sky-800 text-white font-bold"
          >
            <FileUp className="h-4 w-4" />
            {status === 'loading' ? 'جاري الاستيراد...' : 'اختر ملف'}
          </Button>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{message}</span>
              <Badge className="bg-thmanyah-green text-white">{importedCount}</Badge>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-gradient-to-l from-sky-100 to-amber-50 rounded-2xl border border-sky-200">
          <p className="text-xs text-sky-800 leading-relaxed">
            <Sparkles className="h-3.5 w-3.5 inline ml-1 text-amber-500" />
            <strong>يدعم:</strong> أعمدة Meltwater (text, Author Name, Author Handle, URL, Keywords, Content Type, Reach, Engagement, Likes, Replies, Reposts, Views) — إذا لم تتوفر أعمدة المشاعر سيتم تحليلها بالذكاء الاصطناعي.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
