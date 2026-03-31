<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:1']);

        $query = $request->q;

        $posts = Post::where('title', 'like', "%{$query}%")
            ->orWhere('body', 'like', "%{$query}%")
            ->with('user:id,name,username', 'community:id,name,slug')
            ->withSum('votes', 'value')
            ->latest()
            ->take(20)
            ->get();

        $communities = Community::where('name', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->withCount('members')
            ->take(10)
            ->get();

        return response()->json([
            'posts' => $posts,
            'communities' => $communities,
        ]);
    }
}
