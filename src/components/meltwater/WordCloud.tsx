import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, X, ExternalLink, Filter } from 'lucide-react';
import { TweetSortControls, sortTweets, type SortKey, type SortDirection, type TweetWithEngagement } from './TweetSortControls';

interface Tweet extends TweetWithEngagement {}

interface WordCloudProps {
  tweets: Tweet[];
}

const CLOUD_COLORS = [
  'rgba(239,68,68,', // red
  'rgba(249,115,22,', // orange
  'rgba(234,179,8,',  // yellow
  'rgba(34,197,94,',  // green
  'rgba(59,130,246,', // blue
  'rgba(168,85,247,', // purple
  'rgba(236,72,153,', // pink
  'rgba(20,184,166,', // teal
];

export const WordCloud = ({ tweets }: WordCloudProps) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const keywordStats = useMemo(() => {
    const stats: Record<string, { count: number; reach: number; tweets: Tweet[] }> = {};
    const filteredTweets = sentimentFilter ? tweets.filter(t => t.sentiment === sentimentFilter) : tweets;
    filteredTweets.forEach(t => {
      t.keywords.forEach(kw => {
        if (!stats[kw]) stats[kw] = { count: 0, reach: 0, tweets: [] };
        stats[kw].count++;
        stats[kw].reach += t.reach;
        stats[kw].tweets.push(t);
      });
    });
    return stats;
  }, [tweets, sentimentFilter]);

  const sortedWords = useMemo(() => {
    return Object.entries(keywordStats)
      .map(([word, stats]) => ({ word, ...stats, pulse: stats.reach / stats.count }))
      .sort((a, b) => b.reach - a.reach);
  }, [keywordStats]);

  const maxReach = sortedWords[0]?.reach || 1;

  const getWordStyle = (reach: number, index: number) => {
    const ratio = reach / maxReach;
    const fontSize = Math.max(14, Math.min(48, ratio * 52 + 12));
    const fontWeight = ratio > 0.4 ? 900 : ratio > 0.2 ? 700 : ratio > 0.1 ? 600 : 400;
    const colorBase = CLOUD_COLORS[index % CLOUD_COLORS.length];
    const opacity = Math.max(0.6, ratio);
    // Slight random rotation for cloud feel
    const rotation = ((index * 7) % 5) - 2; // -2 to +2 degrees

    return {
      fontSize: `${fontSize}px`,
      fontWeight,
      color: `${colorBase}${opacity})`,
      transform: `rotate(${rotation}deg)`,
      padding: `${Math.max(2, ratio * 8)}px ${Math.max(6, ratio * 14)}px`,
      lineHeight: 1.2,
    };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'إيجابي': return 'bg-green-100 text-green-800 border-green-300';
      case 'سلبي': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-gray-800 border-gray-300';
    }
  };

  const sortedExpandedTweets = useMemo(() => {
    if (!selectedWord || !keywordStats[selectedWord]) return [];
    return sortTweets(keywordStats[selectedWord].tweets, sortKey, sortDirection);
  }, [selectedWord, keywordStats, sortKey, sortDirection]);

  return (
    <div className="space-y-4">
      <Card className="border border-border overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              سحابة الكلمات (حسب النبض)
            </CardTitle>
            <div className="flex gap-2">
              <Filter className="h-4 w-4 self-center text-muted-foreground" />
              {['إيجابي', 'سلبي', 'محايد'].map(s => (
                <Button
                  key={s}
                  variant={sentimentFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSentimentFilter(sentimentFilter === s ? null : s)}
                  className={`text-xs ${sentimentFilter === s ? 'bg-foreground text-primary-foreground' : ''}`}
                >
                  {s}
                </Button>
              ))}
              {sentimentFilter && (
                <Button variant="ghost" size="sm" onClick={() => setSentimentFilter(null)} className="text-xs">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">حجم الكلمة يعكس إجمالي الوصول. اضغط على أي كلمة لعرض التغريدات.</p>
        </CardHeader>
        <CardContent>
          {/* Cloud shape container */}
          <div className="relative mx-auto" style={{ maxWidth: 700 }}>
            {/* Cloud background shape */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(var(--muted)/0.4) 0%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scaleX(1.6) scaleY(0.9)',
              }}
            />
            <div className="relative flex flex-wrap items-center justify-center gap-1 py-8 px-4 min-h-[280px]">
              {sortedWords.map(({ word, reach, count }, index) => (
                <button
                  key={word}
                  onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-125 rounded-2xl hover:bg-foreground/5 ${
                    selectedWord === word ? 'ring-2 ring-foreground bg-foreground/10 scale-110' : ''
                  }`}
                  style={getWordStyle(reach, index)}
                  title={`${word}: ${count}× | وصول: ${reach.toLocaleString()}`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-foreground/70" /> وصول عالي
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-foreground/30" /> وصول متوسط
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-foreground/10" /> وصول منخفض
            </span>
          </div>
        </CardContent>
      </Card>

      {selectedWord && keywordStats[selectedWord] && (
        <Card className="border border-border bg-blue-50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                تغريدات تحتوي على "{selectedWord}"
                <Badge className="bg-foreground text-primary-foreground">{keywordStats[selectedWord].tweets.length}</Badge>
                <Badge variant="outline">{(keywordStats[selectedWord].reach / 1000).toFixed(1)}K وصول</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedWord(null)} className="border border-border">
                <X className="h-4 w-4 ml-1" /> إغلاق
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TweetSortControls activeSort={sortKey} onSortChange={setSortKey} direction={sortDirection} onDirectionChange={setSortDirection} />
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sortedExpandedTweets.map(tweet => (
                <div key={tweet.id} className="p-4 bg-card border-2 rounded-2xl hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-bold">{tweet.author}</p>
                      <p className="text-sm mt-1">{tweet.text}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {tweet.keywords.map((kw, i) => (
                          <Badge key={i} variant={kw === selectedWord ? 'default' : 'secondary'} className={`text-xs ${kw === selectedWord ? 'bg-foreground text-primary-foreground' : ''}`}>
                            {kw}
                          </Badge>
                        ))}
                      </div>
                      {tweet.engagement && (
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>❤️ {tweet.engagement.likes}</span>
                          <span>🔁 {tweet.engagement.retweets}</span>
                          <span>💬 {tweet.engagement.replies}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${getSentimentColor(tweet.sentiment)} border text-xs`}>{tweet.sentiment}</Badge>
                      <span className="text-xs text-muted-foreground font-bold">{tweet.reach.toLocaleString()} وصول</span>
                      <a href={`https://twitter.com/${tweet.author.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" /> عرض
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
