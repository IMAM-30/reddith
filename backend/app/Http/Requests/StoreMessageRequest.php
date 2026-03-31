<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|exists:users,username',
            'body' => 'required|string|max:5000',
        ];
    }

    public function messages(): array
    {
        return [
            'username.exists' => 'Username tidak ditemukan.',
        ];
    }
}
