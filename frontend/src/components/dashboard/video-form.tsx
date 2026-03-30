// ==============================================================================
// components/dashboard/video-form.tsx - Video Input Form
// ==============================================================================

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractVideoId } from '@/lib/utils';

const videoFormSchema = z.object({
  videoUrl: z.string().min(1, 'YouTube URL is required').refine(
    (url) => {
      return extractVideoId(url) !== null;
    },
    { message: 'Invalid YouTube URL format' }
  ),
});

type VideoFormData = z.infer<typeof videoFormSchema>;

interface VideoFormProps {
  onSubmit: (videoUrl: string) => Promise<void>;
  isLoading: boolean;
}

export function VideoForm({ onSubmit, isLoading }: VideoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoFormSchema),
  });

  const onFormSubmit = async (data: VideoFormData) => {
    await onSubmit(data.videoUrl);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <Video className="h-6 w-6 mr-2 text-red-600" />
          Analyze YouTube Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('videoUrl')}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isLoading}
              className={errors.videoUrl ? 'border-red-500' : ''}
            />
            {errors.videoUrl && (
              <p className="text-sm text-red-600 mt-1">{errors.videoUrl.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Paste a YouTube video URL to analyze its comment sentiment
            </p>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Sentiment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
