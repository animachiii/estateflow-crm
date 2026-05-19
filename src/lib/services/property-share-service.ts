import { messageService } from './message-service';
import { emailService } from './email-service';
import { formatCurrency } from '@/lib/utils';
import type { Lead, Property } from '@/types';

export const propertyShareService = {
  generateShareLink(propertyId: string): string {
    return `${process.env.NEXT_PUBLIC_APP_URL}/share/property/${propertyId}`;
  },

  async shareViaWhatsApp(lead: Lead, property: Property) {
    const shareLink = this.generateShareLink(property.id);
    const body = messageService.fillTemplate(
      'Hi {{leadName}}, sharing details of {{propertyTitle}} in {{location}}. Price: {{price}}. Photos and details: {{shareLink}}',
      {
        leadName: lead.full_name.split(' ')[0],
        propertyTitle: property.title,
        location: property.location,
        price: formatCurrency(property.price),
        shareLink,
      }
    );
    return messageService.send({ to: lead.phone, body, channel: 'whatsapp' });
  },

  async shareViaSms(lead: Lead, property: Property) {
    const shareLink = this.generateShareLink(property.id);
    const body = `Hi ${lead.full_name.split(' ')[0]}, check out ${property.title} in ${property.location}. ${formatCurrency(property.price)}. Details: ${shareLink}`;
    return messageService.send({ to: lead.phone, body, channel: 'sms' });
  },

  async shareViaEmail(lead: Lead, property: Property) {
    if (!lead.email) return { success: false, error: 'No email on lead' };
    const shareLink = this.generateShareLink(property.id);
    return emailService.send({
      to: lead.email,
      subject: `Property Details: ${property.title} in ${property.location}`,
      html: `
        <h2>${property.title}</h2>
        <p><strong>Location:</strong> ${property.location}</p>
        <p><strong>Price:</strong> ${formatCurrency(property.price)}</p>
        ${property.size_sqft ? `<p><strong>Size:</strong> ${property.size_sqft} sq.ft</p>` : ''}
        ${property.bedrooms ? `<p><strong>Bedrooms:</strong> ${property.bedrooms}</p>` : ''}
        ${property.description ? `<p>${property.description}</p>` : ''}
        <p><a href="${shareLink}" style="background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px">View Full Details</a></p>
      `,
    });
  },
};
