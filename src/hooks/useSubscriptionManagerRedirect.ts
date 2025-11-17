import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSubscriptionManagerRedirect() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetch('/api/user-role');
        const result = await response.json();
        
        if (response.ok) {
          setUserRole(result.role);
          
          // If user is subscription manager, redirect to settings
          if (result.role === 'subscription_manager') {
            console.log('🎭 Subscription Manager detected, redirecting to settings');
            router.push('/settings');
          }
        } else {
          console.log('❌ Failed to get user role:', result.error);
          setUserRole(null);
        }
      } catch (error) {
        console.log('❌ Error checking user role:', error);
        setUserRole(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserRole();
  }, [router]);

  return {
    userRole,
    isChecking,
    isSubscriptionManager: userRole === 'subscription_manager'
  };
}
