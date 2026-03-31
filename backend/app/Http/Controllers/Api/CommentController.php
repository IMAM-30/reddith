<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->whereNull('parent_id')
            ->with([
                'user:id,name,username',
                'replies.user:id,name,username',
            ])
            ->withSum('votes', 'value')
            ->latest()
            ->paginate(20);

        return response()->json($comments);
    }

    public function store(StoreCommentRequest $request, Post $post): JsonResponse
    {
        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->body,
            'parent_id' => $request->parent_id,
        ]);

        // Send notification to post owner
        if ($post->user_id !== $request->user()->id) {
            $post->user->notify(new \App\Notifications\NewCommentNotification($comment));
        }

        return response()->json($comment->load('user:id,name,username'), 201);
    }

    public function destroy(Request $request, Post $post, \App\Models\Comment $comment): JsonResponse
    {
        if ($request->user()->id !== $comment->user_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}
