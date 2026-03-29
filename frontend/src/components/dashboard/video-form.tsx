'use client';

// ==============================================================================
// src/components/dashboard/video-form.tsx - Video URL Input Form
// ==============================================================================

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { Search, PlayCircle } from 'lucide-react';

const formSchema = z.object({
  videoUrl: z.string().min(1, 'Please enter a YouTube URL or video ID'),
});

type FormData = z.infer<typeof formSchema>;

interface VideoFormProps {
  onSubmit: (videoUrl: string) => Promise<void>;
  isLoading: boolean;
}

export function VideoForm({ onSubmit, isLoading }: VideoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data.videoUrl);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
          <PlayCircle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle>Analyze Video Sentiment</CardTitle>
        <CardDescription>
          Enter a YouTube video URL to analyze audience sentiment from comments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="relative">
            <input
              {...register('videoUrl')}
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {errors.videoUrl && (
            <p className="text-sm text-red-500">{errors.videoUrl.message}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Analyzing Comments...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze Sentiment
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Supports standard YouTube URLs and video IDs
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
