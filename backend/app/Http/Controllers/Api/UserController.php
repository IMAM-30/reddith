<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'karma' => $user->karma,
            'created_at' => $user->created_at,
        ]);
    }

    public function profile(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'nim' => $user->nim,
            'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            'karma' => $user->karma ?? 0,
            'created_at' => $user->created_at,
        ]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Avatar berhasil diperbarui.',
            'avatar' => asset('storage/' . $path),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
            ],
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
