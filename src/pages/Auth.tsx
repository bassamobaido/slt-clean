import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'فشل تسجيل الدخول',
          description: error.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 rounded-2xl shadow-th-lg border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <img src="/Usable/thamanyah.png" alt="Thmanyah" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-display font-bold text-center text-foreground">
            أداة الرصد الاجتماعي
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            تسجيل الدخول للوصول إلى النظام
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-bold">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني..."
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-border"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base font-bold">
              كلمة المرور
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور..."
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-border"
              dir="ltr"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-foreground hover:bg-foreground/90 text-primary-foreground text-lg h-12 font-bold rounded-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>نظام محمي — للمستخدمين المصرح لهم فقط</p>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
