<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\VoteRequest;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    public function votePost(VoteRequest $request, Post $post): JsonResponse
    {
        return $this->toggleVote($request, $post);
    }

    public function voteComment(VoteRequest $request, Comment $comment): JsonResponse
    {
        return $this->toggleVote($request, $comment);
    }

    private function toggleVote(VoteRequest $request, $voteable): JsonResponse
    {
        $existing = $voteable->votes()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            if ($existing->value === (int) $request->value) {
                // Same vote = remove (toggle off)
                $existing->delete();
                $score = (int) $voteable->votes()->sum('value');
                return response()->json(['message' => 'Vote removed.', 'score' => $score]);
            }
            // Different vote = update
            $existing->update(['value' => $request->value]);
        } else {
            $voteable->votes()->create([
                'user_id' => $request->user()->id,
                'value' => $request->value,
            ]);
        }

        $score = (int) $voteable->votes()->sum('value');
        return response()->json(['message' => 'Voted.', 'score' => $score]);
    }
}
