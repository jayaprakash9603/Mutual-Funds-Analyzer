package in.goldentriangle.mfa.config;

/**
 * Spring profile names. Constants rather than literals because {@code @Profile} expressions repeat
 * the same set of names across every persistence adapter.
 */
public final class Profiles {

    public static final String MYSQL = "mysql";
    public static final String H2 = "h2";
    public static final String POSTGRES = "postgres";
    public static final String JPA = "jpa";
    public static final String MONGO = "mongo";
    public static final String NO_DB = "nodb";

    /** Every profile backed by a relational store, i.e. those that activate the JPA adapters. */
    public static final String[] RELATIONAL = {MYSQL, H2, POSTGRES, JPA};

    /** Matches when no persistence profile is active, so the no-op adapters take over. */
    public static final String NO_PERSISTENCE_EXPRESSION =
            "!" + MYSQL + " & !" + H2 + " & !" + POSTGRES + " & !" + MONGO + " & !" + JPA;

    private Profiles() {
    }
}
