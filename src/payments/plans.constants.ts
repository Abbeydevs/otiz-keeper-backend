export const SUBSCRIPTION_PLANS = {
  TALENT: [
    {
      id: 'talent_free',
      name: 'Basic Talent',
      price: 0,
      currency: 'NGN',
      features: ['Create Profile', 'Apply to 3 jobs/month', 'Basic Support'],
    },
    {
      id: 'talent_pro',
      name: 'Pro Talent',
      price: 50,
      currency: 'NGN',
      features: [
        'Unlimited Applications',
        'Featured Profile',
        'Priority Support',
      ],
    },
  ],
  EMPLOYER: [
    {
      id: 'employer_basic',
      name: 'Startup',
      price: 15,
      currency: 'NGN',
      features: ['Post 3 Jobs', 'View 50 Candidates', 'Basic Analytics'],
    },
    {
      id: 'employer_enterprise',
      name: 'Enterprise',
      price: 50,
      currency: 'NGN',
      features: [
        'Unlimited Jobs',
        'Unlimited Candidates',
        'Dedicated Account Manager',
      ],
    },
  ],
};
