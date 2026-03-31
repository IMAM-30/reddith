<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function inbox(Request $request): JsonResponse
    {
        $messages = $request->user()->receivedMessages()
            ->with('sender:id,name,username')
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    public function sent(Request $request): JsonResponse
    {
        $messages = $request->user()->sentMessages()
            ->with('receiver:id,name,username')
            ->latest()
            ->paginate(20);

        return response()->json($messages);
    }

    public function conversation(Request $request, User $user): JsonResponse
    {
        $userId = $request->user()->id;
        $otherId = $user->id;

        $messages = DirectMessage::where(function ($q) use ($userId, $otherId) {
                $q->where('sender_id', $userId)->where('receiver_id', $otherId);
            })
            ->orWhere(function ($q) use ($userId, $otherId) {
                $q->where('sender_id', $otherId)->where('receiver_id', $userId);
            })
            ->with('sender:id,name,username')
            ->oldest()
            ->paginate(50);

        return response()->json($messages);
    }

    public function store(StoreMessageRequest $request): JsonResponse
    {
        $receiver = User::where('username', $request->username)->firstOrFail();

        $message = $request->user()->sentMessages()->create([
            'receiver_id' => $receiver->id,
            'body' => $request->body,
        ]);

        return response()->json($message->load('receiver:id,name,username'), 201);
    }

    public function read(Request $request, DirectMessage $message): JsonResponse
    {
        if ($request->user()->id !== $message->receiver_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $message->update(['read_at' => now()]);

        return response()->json(['message' => 'Marked as read.']);
    }
}
