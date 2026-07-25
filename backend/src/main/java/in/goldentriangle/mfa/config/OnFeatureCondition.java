package in.goldentriangle.mfa.config;

import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

class OnFeatureCondition implements org.springframework.context.annotation.Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        var attrs = metadata.getAnnotationAttributes(ConditionalOnFeature.class.getName());
        if (attrs == null) {
            return false;
        }
        String key = String.valueOf(attrs.get("value"));
        FeatureFlags flags = Binder.get(context.getEnvironment())
                .bind("features", FeatureFlags.class)
                .orElseGet(FeatureFlags::new);
        return FeatureFlagResolver.isEnabled(flags, key);
    }
}
