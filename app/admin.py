# admin.py

from django.contrib import admin
from .models import Player, Guess, Word

admin.site.register(Word)

class GuessInline(admin.TabularInline):  # or admin.StackedInline
    model = Guess
    readonly_fields = ('guess', 'target', 'date')  # optional, e.g. make timestamp read-only

class PlayerAdmin(admin.ModelAdmin):
    inlines = [GuessInline]
    readonly_fields = ('player_id', 'ip_address', 'mac_address')

admin.site.register(Player, PlayerAdmin)
admin.site.register(Guess)

