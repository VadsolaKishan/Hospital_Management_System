from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='billing',
            name='appointment',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='billing', to='appointments.appointment'),
        ),
        migrations.AddField(
            model_name='billing',
            name='balance',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, editable=False),
            preserve_default=False,
        ),
    ]
