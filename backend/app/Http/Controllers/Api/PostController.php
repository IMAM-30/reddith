<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Models\Community;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::with('user:id,name,username', 'community:id,name,slug')
            ->withCount('comments')
            ->withSum('votes', 'value')
            ->latest()
            ->paginate(15);

        return response()->json($posts);
    }

    public function byCommunity(Community $community): JsonResponse
    {
        $posts = $community->posts()
            ->with('user:id,name,username')
            ->withCount('comments')
            ->withSum('votes', 'value')
            ->latest()
            ->paginate(15);

        return response()->json($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('posts', 'public');
        }

        $post = $request->user()->posts()->create($data);

        return response()->json($post->load('user:id,name,username', 'community:id,name,slug'), 201);
    }

    public function show(Post $post): JsonResponse
    {
        $post->load('user:id,name,username', 'community:id,name,slug')
            ->loadCount('comments')
            ->loadSum('votes', 'value');

        return response()->json($post);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        if ($request->user()->id !== $post->user_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }
}
