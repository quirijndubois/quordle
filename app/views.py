# views.py
from django.shortcuts import render
from .models import Word, Player, Guess
import random
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def game(request):
    with open('words.txt') as f:
        words = [line.strip().upper() for line in f.readlines() if len(line.strip()) == 5 and line.strip().isalpha()]
    word = Word.objects.create(word=random.choice(words))


    request.session['word'] = word.word.upper()
    word_length = len(request.session['word'])

    player = identify(request)
    previous_guesses = Guess.objects.filter(player=player).order_by('-date')
    previous_guesses = [guess.guess for guess in previous_guesses if guess.target == request.session['word']]

    colors = []
    for guess in previous_guesses:
        colors.append(check_color(guess, request.session['word']))

    already_finished = (len(previous_guesses) == word.guess_amount) or (request.session['word'] in previous_guesses)

    return render(request, 'index.html', {
        'word_length_range': range(word_length),
        'guess_amount_range': range(word.guess_amount),
        'word_length': word_length,
        'previous_guesses': previous_guesses,
        'colors' : colors,
        'already_finished': already_finished
    })

@csrf_exempt
def check_guess(request):
    if request.method == "POST":
        data = json.loads(request.body)
        guess = data.get("guess", "").upper()
        target = request.session.get("word", "").upper()

        with open('words.txt') as f:
            words = [line.strip().upper() for line in f.readlines()]
        valid_guess = ((guess in words) or (guess == target)) and (len(guess) == len(target))

        if len(guess) != len(target) or not target:
            return JsonResponse({'error': 'Invalid guess or target word'}, status=400)

        result = check_color(guess, target)

        if valid_guess:
            player = identify(request)
            Guess.objects.create(player=player, target=target, guess=guess)

        correct_guess = guess == target

        return JsonResponse({'result': result, 'valid_word': valid_guess, 'correct_guess': correct_guess})

    return JsonResponse({'error': 'Invalid method'}, status=405)

def check_color(guess, target):
    letter_counts = {}
    for letter in target:
        letter_counts[letter] = letter_counts.get(letter, 0) + 1

    result = ['grey'] * len(target)
    for i in range(len(target)):
        if guess[i] == target[i]:
            result[i] = 'green'
            letter_counts[guess[i]] -= 1

    for i in range(len(target)):
        if result[i] == 'grey' and letter_counts.get(guess[i], 0) > 0:
            result[i] = 'yellow'
            letter_counts[guess[i]] -= 1

    return result

def identify(request):
    id = request.session.get('id')
    if not id:
        request.session['id'] = random.randint(1000, 9999)
    ip_address = request.META.get('REMOTE_ADDR')
    mac_address = request.META.get('HTTP_X_FORWARDED_FOR', 'Unknown')

    player = Player.objects.filter(
        player_id=id
    ).first() or Player.objects.filter(
        ip_address=ip_address
    ).first() or Player.objects.filter(
        mac_address=mac_address
    ).first()

    if not player:
        player = Player.objects.create(
            player_id=id, ip_address=ip_address, mac_address=mac_address
        )
    else:
        player.ip_address = ip_address
        player.mac_address = mac_address
        player.save()
    
    return player

