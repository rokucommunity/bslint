sub error1(unusedParam) ' error
    a = 10
    print a
end sub

sub error2(hey as string) ' error
    print "nope"
end sub

sub ok1(x)
    a = 8
    if a > x
        print a
    end if
end sub

sub ok2(_explicitlyUnused)
    a = 10
    print a
end sub
