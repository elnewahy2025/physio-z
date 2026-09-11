// Pre-built provider templates for common services
// These templates can be customized by users after creation

export const PROVIDER_TEMPLATES = {

  // ─── WHATSAPP TEMPLATES ───
  
  'whatsapp_business_api': {
    name: 'WhatsApp Business API',
    providerType: 'WHATSAPP',
    providerSubtype: 'whatsapp_business',
    description: 'Official WhatsApp Business API via Meta',
    baseUrl: 'https://graph.facebook.com/v18.0',
    authMethod: 'BEARER_TOKEN',
    category: 'WHATSAPP',
    isPopular: true,
    credentialsTemplate: {
      accessToken: {
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Permanent access token from Meta Business'
      },
      phoneNumberId: {
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        description: 'Phone number ID from WhatsApp Business'
      }
    },
    capabilities: [
      {
        capability: 'SEND_TEXT_MESSAGE',
        name: 'Send Text Message',
        endpoint: '/{{phoneNumberId}}/messages',
        method: 'POST',
        requestTemplate: {
          body: {
            messaging_product: 'whatsapp',
            to: '{{recipient_phone}}',
            type: 'text',
            text: {
              body: '{{message}}'
            }
          }
        },
        responseMapping: {
          messageId: 'messages[0].id',
          status: 'messages[0].message_status'
        },
        errorMapping: {
          errorPath: 'error',
          messagePath: 'error.message'
        }
      }
    ]
  },

  // ─── EGYPTIAN PAYMENT TEMPLATES ───
  
  'myfawry': {
    name: 'MyFawry (فوري)',
    providerType: 'PAYMENT',
    providerSubtype: 'myfawry',
    description: 'Egyptian payment gateway - Fawry',
    baseUrl: 'https://www.atfawry.com/ECommerceWeb/Fawry/payments',
    authMethod: 'API_KEY_HEADER',
    category: 'EGYPTIAN_PAYMENTS',
    isPopular: true,
    credentialsTemplate: {
      merchantCode: {
        label: 'Merchant Code',
        type: 'text',
        required: true,
        description: 'Your Fawry merchant code'
      },
      merchantKey: {
        label: 'Merchant Key',
        type: 'password',
        required: true,
        description: 'Your Fawry merchant key for signature generation'
      },
      securityKey: {
        label: 'Security Key',
        type: 'password',
        required: false,
        description: 'Optional security key for enhanced security'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_PAYMENT_REFERENCE',
        name: 'Create Payment Reference',
        endpoint: '/charge',
        method: 'POST',
        requestTemplate: {
          body: {
            merchantCode: '{{merchantCode}}',
            merchantRefNum: '{{invoice_number}}',
            customerMobile: '{{customer_phone}}',
            customerName: '{{customer_name}}',
            amount: '{{amount}}',
            currencyCode: 'EGP',
            chargeItems: [{
              itemId: '{{item_id}}',
              description: '{{description}}',
              price: '{{amount}}',
              quantity: 1
            }]
          }
        },
        responseMapping: {
          referenceNumber: 'referenceNumber',
          expirationTime: 'expirationTime',
          statusCode: 'statusCode',
          statusDescription: 'statusDescription'
        },
        errorMapping: {
          errorPath: 'statusCode != 1000',
          messagePath: 'statusDescription'
        }
      },
      {
        capability: 'CHECK_PAYMENT_STATUS',
        name: 'Check Payment Status',
        endpoint: '/status',
        method: 'POST',
        requestTemplate: {
          body: {
            merchantCode: '{{merchantCode}}',
            merchantRefNum: '{{invoice_number}}'
          }
        },
        responseMapping: {
          paymentStatus: 'paymentStatus',
          statusCode: 'statusCode'
        }
      }
    ]
  },

  'instapay': {
    name: 'InstaPay (انستاباي)',
    providerType: 'PAYMENT',
    providerSubtype: 'instapay',
    description: 'Egyptian instant payment system',
    baseUrl: 'https://api.instapay.com.eg',
    authMethod: 'API_KEY_HEADER',
    category: 'EGYPTIAN_PAYMENTS',
    isPopular: true,
    credentialsTemplate: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'InstaPay API key'
      },
      bankAccountNumber: {
        label: 'Bank Account Number',
        type: 'text',
        required: true,
        description: 'Your bank account number'
      },
      bankName: {
        label: 'Bank Name',
        type: 'text',
        required: true,
        description: 'Bank name for InstaPay'
      }
    },
    capabilities: [
      {
        capability: 'GENERATE_PAYMENT_DETAILS',
        name: 'Generate Payment Details',
        endpoint: '/payment-details',
        method: 'POST',
        requestTemplate: {
          body: {
            apiKey: '{{apiKey}}',
            accountNumber: '{{bankAccountNumber}}',
            bankName: '{{bankName}}',
            amount: '{{amount}}',
            reference: '{{invoice_number}}'
          }
        },
        responseMapping: {
          paymentLink: 'paymentLink',
          qrCode: 'qrCode',
          instructions: 'instructions'
        }
      }
    ]
  },

  // ─── INTERNATIONAL PAYMENT TEMPLATES ───
  
  'stripe': {
    name: 'Stripe',
    providerType: 'PAYMENT',
    providerSubtype: 'stripe',
    description: 'International payment gateway',
    baseUrl: 'https://api.stripe.com/v1',
    authMethod: 'BEARER_TOKEN',
    category: 'INTERNATIONAL_PAYMENTS',
    isPopular: true,
    credentialsTemplate: {
      secretKey: {
        label: 'Secret Key',
        type: 'password',
        required: true,
        description: 'Stripe secret key (sk_test_... or sk_live_...)'
      },
      publishableKey: {
        label: 'Publishable Key',
        type: 'text',
        required: false,
        description: 'Stripe publishable key for frontend'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_PAYMENT_INTENT',
        name: 'Create Payment Intent',
        endpoint: '/payment_intents',
        method: 'POST',
        requestTemplate: {
          body: {
            amount: '{{amount_cents}}',
            currency: '{{currency}}',
            'payment_method_types[]': 'card',
            metadata: {
              invoiceId: '{{invoice_id}}',
              patientId: '{{patient_id}}'
            }
          }
        },
        responseMapping: {
          paymentIntentId: 'id',
          clientSecret: 'client_secret',
          status: 'status'
        },
        errorMapping: {
          errorPath: 'error',
          messagePath: 'error.message'
        }
      }
    ]
  },

  // ─── VIDEO TEMPLATES ───
  
  'twilio_video': {
    name: 'Twilio Video',
    providerType: 'VIDEO',
    providerSubtype: 'twilio_video',
    description: 'Video consultation via Twilio',
    baseUrl: 'https://video.twilio.com',
    authMethod: 'BASIC_AUTH',
    category: 'VIDEO',
    isPopular: true,
    credentialsTemplate: {
      accountSid: {
        label: 'Account SID',
        type: 'text',
        required: true,
        description: 'Twilio Account SID'
      },
      authToken: {
        label: 'Auth Token',
        type: 'password',
        required: true,
        description: 'Twilio Auth Token'
      },
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: false,
        description: 'Twilio API Key (optional)'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_ROOM',
        name: 'Create Video Room',
        endpoint: '/v1/Rooms',
        method: 'POST',
        requestTemplate: {
          body: {
            type: 'group',
            unique_name: '{{room_name}}',
            max_participants: 2
          }
        },
        responseMapping: {
          roomSid: 'sid',
          roomName: 'unique_name',
          status: 'status'
        }
      }
    ]
  },

  'daily_co': {
    name: 'Daily.co',
    providerType: 'VIDEO',
    providerSubtype: 'daily_co',
    description: 'Video consultation via Daily.co',
    baseUrl: 'https://api.daily.co/v1',
    authMethod: 'BEARER_TOKEN',
    category: 'VIDEO',
    isPopular: true,
    credentialsTemplate: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Daily.co API key'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_ROOM',
        name: 'Create Video Room',
        endpoint: '/rooms',
        method: 'POST',
        requestTemplate: {
          body: {
            name: '{{room_name}}',
            privacy: 'private',
            properties: {
              max_participants: 2,
              enable_chat: true
            }
          }
        },
        responseMapping: {
          roomUrl: 'url',
          roomName: 'name',
          roomId: 'id'
        }
      }
    ]
  }
};
