import { z } from 'zod';

export const seoCreationRequest = z.object({
  url: z.string().url('Invalid URL'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required').optional(),
  keywords: z.array(z.string().min(1, 'Keyword is required')),
});

export const pdfGenerationRequest = z.object({
  params: z.object({
    id: z.string().min(23, 'Invalid ID'),
  }),
});
