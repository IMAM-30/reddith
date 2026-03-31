<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar,
            'karma' => $user->karma,
            'created_at' => $user->created_at,
        ]);
    }

    public function posts(User $user): JsonResponse
    {
        $posts = $user->posts()
            ->with('community:id,name,slug')
            ->withCount('comments')
            ->withSum('votes', 'value')
            ->latest()
            ->paginate(15);

        return response()->json($posts);
    }
}
