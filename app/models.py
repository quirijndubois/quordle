from django.db import models

# Create your models here.
class Word(models.Model):
    word = models.CharField(max_length=255)
    guess_amount = models.IntegerField(default=6)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.word

class Player(models.Model):
    player_id = models.IntegerField()
    ip_address = models.CharField(max_length=255)
    mac_address = models.CharField(max_length=255)

    def __str__(self):
        return str(self.player_id) + " at " + self.ip_address

class Guess(models.Model):
    guess = models.CharField(max_length=255)
    target = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    player = models.ForeignKey(Player, on_delete=models.CASCADE, default=None, null=True)

    def __str__(self):
        return self.guess
