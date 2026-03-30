// ==============================================================================
// components/dashboard/video-form.tsx - Video Input Form (TUBE-SENTI Theme)
// ==============================================================================

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
    <div className="border border-outline-variant/20 bg-surface-container-lowest p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 border border-outline-variant/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            play_circle
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-on-surface font-headline">
            Initialize Analysis
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label">
            Input YouTube Video URL
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div>
          <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant font-medium mb-2 font-label">
            Video URL
          </label>
          <input
            {...register('videoUrl')}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isLoading}
            className={`w-full bg-surface-container-lowest border outline-none ring-1 text-on-surface text-sm tracking-wide py-3.5 px-4 transition-all placeholder:text-outline font-mono ${
              errors.videoUrl
                ? 'ring-error/50 border-error/30'
                : 'ring-outline-variant/30 border-outline-variant/20 focus:ring-primary/50'
            }`}
          />
          {errors.videoUrl && (
            <p className="text-[10px] text-error mt-2 tracking-wide">{errors.videoUrl.message}</p>
          )}
          <p className="text-[10px] text-on-surface-variant mt-2 tracking-wide">
            Supports standard URLs, short links (youtu.be), and embed formats
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-on-primary font-bold uppercase tracking-[0.15em] text-[11px] py-4 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Processing Stream...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">query_stats</span>
              Execute Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
