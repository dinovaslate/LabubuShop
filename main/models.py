from django.db import models
import uuid

class Product(models.Model):
    CATEGORY_CHOICES = [
        ("Player Equipment", "player equipment"),
        ("Apparel", "apparel"),
        ("Fan Merchandise", "fan merchandise"),
        ("Coaching & Referee Gear", "coaching and referee gear"),
        ("Accessories & Care", "accessories and care"),
        ("Teamwear & Custom Kits", "teamwear and custom kits")
    ]
    name = models.CharField(max_length=30)
    price = models.IntegerField()
    description = models.TextField()
    thumbnail = models.URLField()
    category = models.CharField(max_length=30)
    is_featured = models.BooleanField()
    rating = models.IntegerField()

# Create your models here.
